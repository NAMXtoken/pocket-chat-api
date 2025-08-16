-- Create required tables for the Twilio WhatsApp webhook with secure defaults
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Contacts table to track unique chat participants per platform
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  display_name TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contacts_platform_phone_unique UNIQUE (platform, phone_number)
);

-- Enable Row Level Security (no policies by default = no public access)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Messages table to store inbound/outbound messages tied to a contact
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  direction TEXT NOT NULL,
  body TEXT,
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,
  provider_message_id TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (no policies by default = no public access)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_messages_contact_created_at ON public.messages (contact_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_provider_message_id_unique ON public.messages (provider_message_id) WHERE provider_message_id IS NOT NULL;

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers to keep updated_at fresh
DROP TRIGGER IF EXISTS trig_contacts_updated ON public.contacts;
CREATE TRIGGER trig_contacts_updated
BEFORE UPDATE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trig_messages_updated ON public.messages;
CREATE TRIGGER trig_messages_updated
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
