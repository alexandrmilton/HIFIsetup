-- Editing a setup must send it back through moderation, but owners are
-- deliberately barred from writing moderation_status (that is what stopped
-- self-approval). This definer function lets an owner move their own setup
-- back to `pending` and nothing else — it cannot approve.
create or replace function public.request_setup_review(p_slug text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
begin
  select owner_id into owner from public.setups where slug = p_slug;

  if owner is null then
    raise exception 'setup not found' using errcode = 'P0002';
  end if;

  if owner <> auth.uid() then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  update public.setups
     set moderation_status = 'pending',
         moderation_note = null,
         reviewed_at = null
   where slug = p_slug;

  return true;
end;
$$;

revoke all on function public.request_setup_review(text) from public, anon;
grant execute on function public.request_setup_review(text) to authenticated;
