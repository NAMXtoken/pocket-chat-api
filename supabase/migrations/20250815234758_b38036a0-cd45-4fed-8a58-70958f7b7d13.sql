-- Fix security definer functions by setting search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_contact_last_message_at()
RETURNS TRIGGER
LANGUAGE plpgsql  
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.contacts
  SET last_message_at = NEW.received_at,
      updated_at = now()
  WHERE id = NEW.contact_id;
  RETURN NEW;
END;
$$;