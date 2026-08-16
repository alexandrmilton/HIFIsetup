create type public.moderation_status as enum ('pending', 'approved', 'rejected');

alter table public.profiles add column if not exists is_admin boolean not null default false;

alter table public.setups
  add column if not exists moderation_status public.moderation_status not null default 'pending',
  add column if not exists moderation_note text,
  add column if not exists reviewed_at timestamptz;

-- Setups that already existed predate moderation, so keep them visible.
update public.setups set moderation_status = 'approved', reviewed_at = now();

create index setups_moderation_idx on public.setups (moderation_status);
create index setups_updated_idx on public.setups (updated_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger setups_touch_updated_at
  before update on public.setups
  for each row execute function public.touch_updated_at();

create table public.setup_comments (
  id uuid primary key default gen_random_uuid(),
  setup_id uuid not null references public.setups(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index setup_comments_setup_idx on public.setup_comments (setup_id, created_at desc);

alter table public.setup_comments enable row level security;

create policy "comments are public" on public.setup_comments for select to anon, authenticated using (true);
create policy "members write comments" on public.setup_comments for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "authors delete own comments" on public.setup_comments for delete to authenticated using ((select auth.uid()) = author_id or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin));

grant select on public.setup_comments to anon, authenticated;
grant insert, delete on public.setup_comments to authenticated;

-- Admins may moderate any setup.
create policy "admins update any setup" on public.setups for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin));

create policy "admins delete any setup" on public.setups for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin));
