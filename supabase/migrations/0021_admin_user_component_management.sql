-- Admins need to prune the shared catalogue of junk entries members added by
-- hand. Both functions are definer + admin-checked: `components` has no DELETE
-- policy at all, so this is the only path, and moderators are deliberately
-- excluded (same split as setup deletion).
--
-- Applied remotely as: admin_user_component_management.

create or replace function public.list_user_components()
returns table (
  id uuid,
  brand text,
  model text,
  category text,
  origin public.component_origin,
  created_at timestamptz,
  submitted_by uuid,
  submitter_name text,
  setups jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id, c.brand, c.model, c.category, c.origin, c.created_at,
    c.submitted_by,
    p.display_name as submitter_name,
    coalesce(
      (select jsonb_agg(jsonb_build_object('slug', s.slug, 'title', s.title) order by s.created_at desc)
         from public.setup_components sc
         join public.setups s on s.id = sc.setup_id
        where sc.component_id = c.id),
      '[]'::jsonb
    ) as setups
  from public.components c
  left join public.profiles p on p.id = c.submitted_by
  where c.submitted_by is not null
    and exists (select 1 from public.profiles a where a.id = auth.uid() and a.is_admin)
  order by c.created_at desc;
$$;

-- Removing a catalogue entry also unlinks it from any setup that used it —
-- setup_components.component_id is ON DELETE RESTRICT, so the link rows must
-- go first, and leaving them would keep a deleted component visible.
create or replace function public.delete_component(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  if not exists (select 1 from public.components where id = p_id and submitted_by is not null) then
    raise exception 'component not found' using errcode = 'P0002';
  end if;

  delete from public.setup_components where component_id = p_id;
  delete from public.components where id = p_id;
  return true;
end;
$$;

revoke all on function public.list_user_components() from public, anon;
revoke all on function public.delete_component(uuid) from public, anon;
grant execute on function public.list_user_components() to authenticated;
grant execute on function public.delete_component(uuid) to authenticated;
