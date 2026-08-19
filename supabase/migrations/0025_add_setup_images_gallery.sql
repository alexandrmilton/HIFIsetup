-- Extra photos beyond the cover. setups.cover_path stays the single source of
-- truth for the main image — home cards, OG tags, the admin queue and the
-- public API all read it — so this table holds only the additional shots and
-- nothing has to be kept in sync.
--
-- Applied remotely as: add_setup_images_gallery.

create table if not exists public.setup_images (
  id uuid primary key default gen_random_uuid(),
  setup_id uuid not null references public.setups(id) on delete cascade,
  path text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists setup_images_setup_position_idx
  on public.setup_images (setup_id, position);

alter table public.setup_images enable row level security;

-- Visibility mirrors setup_components exactly: a photo must never outlive the
-- visibility of the setup it belongs to.
drop policy if exists "guests see images of approved setups" on public.setup_images;
create policy "guests see images of approved setups" on public.setup_images
  for select to anon
  using (exists (select 1 from public.setups s
                  where s.id = setup_id and s.is_published and s.moderation_status = 'approved'));

drop policy if exists "members see allowed setup images" on public.setup_images;
create policy "members see allowed setup images" on public.setup_images
  for select to authenticated
  using (exists (select 1 from public.setups s
                  where s.id = setup_id
                    and ((s.is_published and s.moderation_status = 'approved')
                         or s.owner_id = (select auth.uid())
                         or exists (select 1 from public.profiles p
                                     where p.id = (select auth.uid()) and (p.is_admin or p.is_moderator)))));

drop policy if exists "members add images to own setups" on public.setup_images;
create policy "members add images to own setups" on public.setup_images
  for insert to authenticated
  with check (exists (select 1 from public.setups s
                       where s.id = setup_id and s.owner_id = (select auth.uid())));

drop policy if exists "members remove images from own setups" on public.setup_images;
create policy "members remove images from own setups" on public.setup_images
  for delete to authenticated
  using (exists (select 1 from public.setups s
                  where s.id = setup_id and s.owner_id = (select auth.uid())));

-- Read-only for anon, and no UPDATE for anyone: the wizard replaces the whole
-- set on save, so there is no path that needs to mutate a row in place.
grant select on public.setup_images to anon, authenticated;
grant insert, delete on public.setup_images to authenticated;

-- Serve the gallery through the same definer function the detail page uses.
create or replace function public.get_setup_detail(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'slug', s.slug,
    'title', s.title,
    'city', s.city,
    'country', s.country,
    'description', s.description,
    'cover_path', s.cover_path,
    'is_published', s.is_published,
    'moderation_status', s.moderation_status,
    'owner_id', s.owner_id,
    'owner_name', p.display_name,
    'room_size', s.room_size,
    'has_acoustic_treatment', s.has_acoustic_treatment,
    'acoustic_notes', s.acoustic_notes,
    'listening_notes', s.listening_notes,
    'budget_range', s.budget_range,
    'created_at', s.created_at,
    'updated_at', s.updated_at,
    'like_count', (select count(*) from public.setup_likes l where l.setup_id = s.id),
    'images', coalesce((
      select jsonb_agg(si.path order by si.position)
      from public.setup_images si
      where si.setup_id = s.id
    ), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(c.name order by c.sort_order)
      from public.setup_categories sc
      join public.categories c on c.id = sc.category_id
      where sc.setup_id = s.id
    ), '[]'::jsonb),
    'components', coalesce((
      select jsonb_agg(jsonb_build_object(
        'position', sc2.position,
        'is_extra', sc2.is_extra,
        'id', comp.id,
        'brand', comp.brand,
        'model', comp.model,
        'category', comp.category,
        'origin', comp.origin,
        'image_url', comp.image_url
      ) order by sc2.is_extra, sc2.position)
      from public.setup_components sc2
      join public.components comp on comp.id = sc2.component_id
      where sc2.setup_id = s.id
    ), '[]'::jsonb),
    'comments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', cm.id,
        'body', cm.body,
        'created_at', cm.created_at,
        'author_id', cm.author_id,
        'author_name', cp.display_name,
        'author_avatar', cp.avatar_path
      ) order by cm.created_at desc)
      from public.setup_comments cm
      left join public.profiles cp on cp.id = cm.author_id
      where cm.setup_id = s.id
    ), '[]'::jsonb)
  )
  from public.setups s
  left join public.profiles p on p.id = s.owner_id
  where s.slug = p_slug;
$$;
