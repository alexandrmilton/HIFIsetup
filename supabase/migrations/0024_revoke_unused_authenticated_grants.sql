-- Grants with no matching RLS policy are inert today but are the same latent
-- hazard the anon grants were (see 0023): a permissive policy added later
-- silently turns them on. None of these are reachable from the app.
--
--   categories        — never written from the client at all
--   components DELETE — admins remove entries via delete_component()
--   profiles   DELETE — accounts are removed through Supabase auth, not here
--
-- Applied remotely as: revoke_unused_authenticated_grants.

revoke insert, update, delete on public.categories from authenticated;
revoke delete on public.components from authenticated;
revoke delete on public.profiles from authenticated;
