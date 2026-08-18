-- Admins can now correct a member-submitted catalogue entry (typos, wrong
-- category, wrong origin) instead of only deleting it. Same gate as
-- delete_component: definer + admin-checked, and only rows a member added —
-- the seeded catalogue stays fixed.
--
-- Applied remotely as: admin_update_user_component.

create or replace function public.update_component(
  p_id uuid,
  p_brand text,
  p_model text,
  p_category text,
  p_origin public.component_origin
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  if btrim(coalesce(p_brand, '')) = ''
     or btrim(coalesce(p_model, '')) = ''
     or btrim(coalesce(p_category, '')) = '' then
    raise exception 'invalid input' using errcode = '22023';
  end if;

  if not exists (select 1 from public.components where id = p_id and submitted_by is not null) then
    raise exception 'component not found' using errcode = 'P0002';
  end if;

  -- A rename onto an existing pair trips components_brand_model_ci_idx and
  -- surfaces as 23505, which the route turns into a "already exists" message.
  update public.components
     set brand = btrim(p_brand),
         model = btrim(p_model),
         category = btrim(p_category),
         origin = p_origin
   where id = p_id;

  return true;
end;
$$;

revoke all on function public.update_component(uuid, text, text, text, public.component_origin) from public, anon;
grant execute on function public.update_component(uuid, text, text, text, public.component_origin) to authenticated;
