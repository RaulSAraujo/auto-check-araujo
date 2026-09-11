-- Tighten grants: authenticated only (anon must not call typeahead).
revoke all on function public.search_vehicle_options(text, integer, uuid) from public, anon;
grant execute on function public.search_vehicle_options(text, integer, uuid) to authenticated;
