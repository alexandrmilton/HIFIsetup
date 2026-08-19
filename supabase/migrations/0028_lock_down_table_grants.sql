-- Two gaps found re-auditing after the gallery and admin work landed.
--
-- 1. 0023 stripped anon's write grants, but only from the tables that existed
--    at the time. Supabase ships ALTER DEFAULT PRIVILEGES granting ALL on new
--    public tables to anon and authenticated, so setup_images (created in
--    0025) arrived with DELETE, INSERT, UPDATE and TRUNCATE for anon. RLS
--    still refused every write, but that is one permissive policy away from
--    being real.
--
-- 2. 0023 revoked INSERT/UPDATE/DELETE and left TRUNCATE, TRIGGER and
--    REFERENCES behind on every table. TRUNCATE is the one that matters: it is
--    not filtered by row level security, so holding it defeats the whole model
--    if any path ever reaches it.
--
-- Applied remotely as: lock_down_new_table_grants, revoke_truncate_trigger_references.

-- The table that already slipped through.
revoke all on public.setup_images from anon;
grant select on public.setup_images to anon;

revoke all on public.setup_images from authenticated;
grant select, insert, delete on public.setup_images to authenticated;

-- Deliberately surgical — REVOKE ALL then re-grant would drop the column-level
-- UPDATE grants on profiles and setups that keep is_admin, is_moderator and
-- moderation_status out of members' reach.
do $$
declare t text;
begin
  foreach t in array array['categories','components','profiles','setup_categories',
                           'setup_comments','setup_components','setup_images',
                           'setup_likes','setups']
  loop
    execute format('revoke truncate, trigger, references on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- Fix the source, so the next table does not repeat it. New tables now arrive
-- with no role grants at all and must be granted deliberately.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on tables from authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on tables from authenticated;
