-- Lets an unauthenticated visitor open a private (unpublished) setup via its
-- direct slug link without relaxing RLS: this function runs as its owner
-- (bypassing RLS on setups/setup_components/categories internally) but only
-- ever returns the single row matching the exact slug passed in.
create or replace function public.get_setup_detail(p_slug text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'slug', s.slug,
    'title', s.title,
    'city', s.city,
    'description', s.description,
    'cover_path', s.cover_path,
    'is_published', s.is_published,
    'owner_name', p.display_name,
    'categories', coalesce((
      select jsonb_agg(c.name order by c.sort_order)
      from public.setup_categories sc
      join public.categories c on c.id = sc.category_id
      where sc.setup_id = s.id
    ), '[]'::jsonb),
    'components', coalesce((
      select jsonb_agg(jsonb_build_object(
        'position', sc2.position,
        'id', comp.id,
        'brand', comp.brand,
        'model', comp.model,
        'category', comp.category,
        'origin', comp.origin,
        'image_url', comp.image_url
      ) order by sc2.position)
      from public.setup_components sc2
      join public.components comp on comp.id = sc2.component_id
      where sc2.setup_id = s.id
    ), '[]'::jsonb)
  )
  from public.setups s
  left join public.profiles p on p.id = s.owner_id
  where s.slug = p_slug;
$$;

revoke all on function public.get_setup_detail(text) from public;
grant execute on function public.get_setup_detail(text) to anon, authenticated;
