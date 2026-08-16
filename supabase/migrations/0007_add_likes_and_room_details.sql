alter table public.setups
  add column if not exists room_size text,
  add column if not exists has_acoustic_treatment boolean,
  add column if not exists acoustic_notes text,
  add column if not exists listening_notes text,
  add column if not exists budget_range text;

create table public.setup_likes (
  setup_id uuid not null references public.setups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (setup_id, user_id)
);

create index setup_likes_setup_idx on public.setup_likes (setup_id);

alter table public.setup_likes enable row level security;

create policy "likes are public" on public.setup_likes for select to anon, authenticated using (true);
create policy "members like setups" on public.setup_likes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "members unlike setups" on public.setup_likes for delete to authenticated using ((select auth.uid()) = user_id);

grant select on public.setup_likes to anon, authenticated;
grant insert, delete on public.setup_likes to authenticated;
