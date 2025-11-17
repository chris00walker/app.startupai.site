-- Fix search_path vulnerability in update_updated_at_column trigger function
-- Trigger functions should have fixed search_path for security and predictability

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = pg_catalog, public  -- Fixed: prevent schema shadowing
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
