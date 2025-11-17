-- Fix search_path vulnerability in set_updated_at_timestamp trigger function
-- Trigger functions should have fixed search_path for security and predictability

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = pg_catalog, public  -- Fixed: prevent schema shadowing
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
