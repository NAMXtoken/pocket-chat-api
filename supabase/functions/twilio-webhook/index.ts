// Twilio WhatsApp webhook -> stores inbound messages in Supabase
// Public endpoint (JWT disabled via supabase/config.toml)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hmacSha1Base64(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: { name: "SHA-1" } },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  // Convert ArrayBuffer to base64
  const bytes = new Uint8Array(signature);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env");
    return json({ error: "Server not configured" }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const contentType = req.headers.get("content-type") || "";
  let form: FormData | null = null;
  try {
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      form = await req.formData();
    } else {
      // Twilio sends form-encoded; but handle JSON for testing
      const body = await req.json().catch(() => ({}));
      form = new FormData();
      Object.entries(body as Record<string, any>).forEach(([k, v]) => form!.set(k, String(v)));
    }
  } catch (e) {
    console.error("Failed to parse body", e);
    return json({ error: "Invalid body" }, 400);
  }

  // Optional: Validate Twilio signature if provided
  try {
    const twilioSig = req.headers.get("X-Twilio-Signature");
    const authToken = (Deno.env.get("TWILIO_AUTH_TOKEN") || "").trim();
    if (twilioSig && authToken) {
      const fullUrl = req.url; // Twilio requires exact full URL (including query string)
      // Build concatenated string: full URL + sorted param key/value
      const entries: [string, string][] = [];
      for (const [k, v] of form!.entries()) entries.push([k, String(v)]);
      entries.sort((a, b) => a[0].localeCompare(b[0]));
      const concatenated = fullUrl + entries.map(([k, v]) => `${k}${v}`).join("");
      const expected = await hmacSha1Base64(authToken, concatenated);
      if (expected !== twilioSig) {
        console.warn("Twilio signature mismatch", { expected, got: twilioSig });
        return json({ error: "Signature verification failed" }, 403);
      }
    }
  } catch (e) {
    console.error("Signature validation error", e);
    return json({ error: "Signature validation error" }, 400);
  }

  // Extract common Twilio WhatsApp fields
  const from = String(form.get("From") || ""); // e.g., "whatsapp:+123456789"
  const waId = String(form.get("WaId") || ""); // just digits
  const profileName = String(form.get("ProfileName") || "");
  const to = String(form.get("To") || "");
  const body = String(form.get("Body") || "");
  const messageSid = String(form.get("MessageSid") || "");
  const numMedia = Number(form.get("NumMedia") || 0);

  const platform = "whatsapp";
  // Normalize phone number: prefer WaId, else extract from From
  const phoneNumber = waId || from.replace(/^whatsapp:/, "");

  // Collect media URLs
  const mediaUrls: string[] = [];
  for (let i = 0; i < numMedia; i++) {
    const url = form.get(`MediaUrl${i}`);
    if (url) mediaUrls.push(String(url));
  }

  // Convert form to raw payload object
  const raw: Record<string, string> = {};
  for (const [k, v] of form.entries()) raw[k] = String(v);

  try {
    // Upsert contact by unique (platform, phone_number)
    const { data: contact, error: upsertErr } = await supabase
      .from("contacts")
      .upsert(
        {
          phone_number: phoneNumber,
          platform,
          display_name: profileName || null,
          metadata: { to, from },
        },
        { onConflict: "platform,phone_number" }
      )
      .select()
      .single();

    if (upsertErr) {
      console.error("Contact upsert error", upsertErr);
      return json({ error: "DB error (contact)" }, 500);
    }

    const { error: insertErr } = await supabase.from("messages").insert({
      contact_id: contact.id,
      platform,
      direction: "inbound",
      body,
      media_urls: mediaUrls,
      status: "received",
      provider_message_id: messageSid || null,
      raw_payload: raw,
    });

    if (insertErr) {
      console.error("Message insert error", insertErr);
      return json({ error: "DB error (message)" }, 500);
    }

    // Respond success; Twilio accepts 200 with any body
    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error("Unhandled error", e);
    return json({ error: "Server error" }, 500);
  }
});
