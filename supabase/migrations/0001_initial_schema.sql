-- roomtone: normalized audio catalogue, user setups, RLS and public image bucket
create type public.component_origin as enum ('standard', 'handmade', 'custom_order');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text unique,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.components (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  category text not null,
  origin public.component_origin not null default 'standard',
  image_url text,
  submitted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (brand, model)
);

create table public.setups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique,
  title text not null check (char_length(title) between 2 and 100),
  city text,
  description text,
  cover_path text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.setup_components (
  setup_id uuid not null references public.setups(id) on delete cascade,
  component_id uuid not null references public.components(id) on delete restrict,
  position smallint not null default 0 check (position >= 0),
  note text,
  primary key (setup_id, component_id)
);

create index setups_public_created_idx on public.setups (created_at desc) where is_published;
create index setups_owner_idx on public.setups (owner_id);
create index components_search_idx on public.components (brand, model);
create index components_submitted_by_idx on public.components (submitted_by);
create index setup_components_component_idx on public.setup_components (component_id);

alter table public.profiles enable row level security;
alter table public.components enable row level security;
alter table public.setups enable row level security;
alter table public.setup_components enable row level security;

create policy "profiles are public" on public.profiles for select to anon, authenticated using (true);
create policy "users create their profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "users update their profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "catalogue is public" on public.components for select to anon, authenticated using (true);
create policy "users add their components" on public.components for insert to authenticated with check ((select auth.uid()) = submitted_by);
create policy "users edit own components" on public.components for update to authenticated using ((select auth.uid()) = submitted_by) with check ((select auth.uid()) = submitted_by);
create policy "guests see published setups" on public.setups for select to anon using (is_published);
create policy "members see public or own setups" on public.setups for select to authenticated using (is_published or (select auth.uid()) = owner_id);
create policy "members create own setups" on public.setups for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "members update own setups" on public.setups for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "members delete own setups" on public.setups for delete to authenticated using ((select auth.uid()) = owner_id);
create policy "guests see components of published setups" on public.setup_components for select to anon using (exists (select 1 from public.setups where setups.id = setup_id and setups.is_published));
create policy "members see allowed setup components" on public.setup_components for select to authenticated using (exists (select 1 from public.setups where setups.id = setup_id and (setups.is_published or setups.owner_id = (select auth.uid()))));
create policy "members add components to own setups" on public.setup_components for insert to authenticated with check (exists (select 1 from public.setups where setups.id = setup_id and setups.owner_id = (select auth.uid())));
create policy "members edit components of own setups" on public.setup_components for update to authenticated using (exists (select 1 from public.setups where setups.id = setup_id and setups.owner_id = (select auth.uid()))) with check (exists (select 1 from public.setups where setups.id = setup_id and setups.owner_id = (select auth.uid())));
create policy "members remove components from own setups" on public.setup_components for delete to authenticated using (exists (select 1 from public.setups where setups.id = setup_id and setups.owner_id = (select auth.uid())));

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.components, public.setups, public.setup_components to anon, authenticated;
grant insert, update, delete on public.profiles, public.components, public.setups, public.setup_components to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('setup-images', 'setup-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
create policy "public setup images" on storage.objects for select to anon, authenticated using (bucket_id = 'setup-images');
create policy "members upload own setup images" on storage.objects for insert to authenticated with check (bucket_id = 'setup-images' and owner_id = (select auth.uid())::text);
create policy "members update own setup images" on storage.objects for update to authenticated using (bucket_id = 'setup-images' and owner_id = (select auth.uid())::text) with check (bucket_id = 'setup-images' and owner_id = (select auth.uid())::text);
create policy "members delete own setup images" on storage.objects for delete to authenticated using (bucket_id = 'setup-images' and owner_id = (select auth.uid())::text);

insert into public.components (id, brand, model, category, origin) values
  ('f0d1e2a3-b4c5-46d7-8901-000000000001', 'Audio-Technica', 'AT-LP7', 'Програвач', 'standard'),
  ('f0d1e2a3-b4c5-46d7-8901-000000000002', 'WiiM', 'Ultra', 'Стример', 'standard'),
  ('f0d1e2a3-b4c5-46d7-8901-000000000003', 'KEF', 'LS50 Meta', 'Акустика', 'standard'),
  ('f0d1e2a3-b4c5-46d7-8901-000000000004', 'Cambridge Audio', 'CXN V2', 'Стример', 'standard'),
  ('f0d1e2a3-b4c5-46d7-8901-000000000005', 'Oleh Audio', 'Однотактний ламповий підсилювач', 'Підсилювач', 'handmade'),
  ('f0d1e2a3-b4c5-46d7-8901-000000000006', 'Studio Kvit', 'Стійки під монітори', 'Аксесуар', 'custom_order')
on conflict (id) do nothing;
