-- Enums for messaging platforms and directions
CREATE TYPE public.messaging_platform AS ENUM ('whatsapp', 'telegram', 'line', 'sms');
CREATE TYPE public.message_direction AS ENUM ('inbound', 'outbound');

-- Contacts table keyed by platform + phone number
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  platform public.messaging_platform NOT NULL,
  display_name TEXT,
  metadata JSONB,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform, phone_number)
);

-- Messages table linked to contacts
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  platform public.messaging_platform NOT NULL,
  direction public.message_direction NOT NULL,
  body TEXT,
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'received',
  provider_message_id TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_payload JSONB
);

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: allow authenticated users to read, service role can do everything else
CREATE POLICY "Authenticated can read contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can read messages"
ON public.messages
FOR SELECT
TO authenticated
USING (true);

-- Timestamps helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for contacts.updated_at
CREATE TRIGGER trg_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Keep last_message_at on contacts fresh when new messages arrive
CREATE OR REPLACE FUNCTION public.update_contact_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.contacts
  SET last_message_at = NEW.received_at,
      updated_at = now()
  WHERE id = NEW.contact_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_messages_after_insert
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_contact_last_message_at();

-- Helpful indexes
CREATE INDEX idx_contacts_last_message_at ON public.contacts (last_message_at DESC);
CREATE INDEX idx_messages_contact_time ON public.messages (contact_id, received_at DESC);
