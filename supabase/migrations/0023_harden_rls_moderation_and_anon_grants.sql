-- Security hardening pass.
--
-- Moderation was enforced only in the application's queries, never in RLS: the
-- anon policy read `using (is_published)` with no status check, so anyone
-- holding the (public) anon key could read pending and rejected setups — and
-- their moderation_note — straight from PostgREST, before a moderator saw them.
--
-- The same policy also had no staff branch, so the moderation queue could not
-- see a *private* setup awaiting review. Both are fixed together here.
--
-- Applied remotely as: harden_rls_moderation_and_anon_grants.

drop policy if exists "guests see published setups" on public.setups;
create policy "guests see approved setups" on public.setups
  for select to anon
  using (is_published and moderation_status = 'approved');

drop policy if exists "members see public or own setups" on public.setups;
create policy "members see approved, own or reviewable setups" on public.setups
  for select to authenticated
  using (
    (is_published and moderation_status = 'approved')
    or owner_id = (select auth.uid())
    or exists (select 1 from public.profiles p
                where p.id = (select auth.uid()) and (p.is_admin or p.is_moderator))
  );

-- Component rows must not outlive the visibility of the setup they belong to.
drop policy if exists "guests see components of published setups" on public.setup_components;
create policy "guests see components of approved setups" on public.setup_components
  for select to anon
  using (exists (select 1 from public.setups s
                  where s.id = setup_id and s.is_published and s.moderation_status = 'approved'));

drop policy if exists "members see allowed setup components" on public.setup_components;
create policy "members see allowed setup components" on public.setup_components
  for select to authenticated
  using (exists (select 1 from public.setups s
                  where s.id = setup_id
                    and ((s.is_published and s.moderation_status = 'approved')
                         or s.owner_id = (select auth.uid())
                         or exists (select 1 from public.profiles p
                                     where p.id = (select auth.uid()) and (p.is_admin or p.is_moderator)))));

-- Comments were world-readable regardless of whether the setup they hang off
-- is private or still unmoderated.
drop policy if exists "comments are public" on public.setup_comments;
create policy "comments follow their setup" on public.setup_comments
  for select to anon, authenticated
  using (exists (select 1 from public.setups s
                  where s.id = setup_id
                    and ((s.is_published and s.moderation_status = 'approved')
                         or s.owner_id = (select auth.uid())
                         or exists (select 1 from public.profiles p
                                     where p.id = (select auth.uid()) and (p.is_admin or p.is_moderator)))));

-- The catalogue is shared: this policy let any member rewrite the brand, model
-- or category of a component already used by other people's setups. The app
-- never updates components from the client; admins edit via update_component().
drop policy if exists "users edit own components" on public.components;
revoke update on public.components from authenticated;

-- anon is a read-only role. It held table-level INSERT/UPDATE on every column,
-- including profiles.is_admin and setups.moderation_status. RLS denies those
-- today, but a single over-permissive policy added later would open them.
revoke insert, update, delete on all tables in schema public from anon;

-- Trigger functions are invoked by the trigger, not through the API.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
