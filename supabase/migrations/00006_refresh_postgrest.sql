-- Refresh PostgREST schema cache after role/plan updates
NOTIFY pgrst, 'reload schema';
