create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order smallint not null default 0
);

create table public.setup_categories (
  setup_id uuid not null references public.setups(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (setup_id, category_id)
);

alter table public.categories enable row level security;
alter table public.setup_categories enable row level security;

create policy "categories are public" on public.categories for select to anon, authenticated using (true);
create policy "setup categories are public" on public.setup_categories for select to anon, authenticated using (true);
create policy "members tag own setups" on public.setup_categories for insert to authenticated with check (exists (select 1 from public.setups where setups.id = setup_id and setups.owner_id = (select auth.uid())));
create policy "members untag own setups" on public.setup_categories for delete to authenticated using (exists (select 1 from public.setups where setups.id = setup_id and setups.owner_id = (select auth.uid())));

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.setup_categories to anon, authenticated;
grant insert, delete on public.setup_categories to authenticated;

insert into public.categories (name, slug, sort_order) values
  ('Вініл', 'vinyl', 1),
  ('Стрімінг', 'streaming', 2),
  ('Навушники', 'headphones', 3),
  ('Хай-енд', 'high-end', 4),
  ('DIY / Handmade', 'diy-handmade', 5),
  ('Custom order', 'custom-order', 6),
  ('Бюджетний', 'budget', 7),
  ('Мінімалізм', 'minimalism', 8),
  ('Ретро', 'retro', 9),
  ('Домашній кінотеатр', 'home-cinema', 10),
  ('Багатокімнатний', 'multiroom', 11),
  ('Портативний', 'portable', 12),
  ('Студійний', 'studio', 13),
  ('Автозвук', 'car-audio', 14),
  ('Комп''ютерний звук', 'desktop', 15),
  ('Джаз', 'jazz', 16),
  ('Класика', 'classical', 17),
  ('Рок', 'rock', 18),
  ('Метал', 'metal', 19),
  ('Електроніка', 'electronic', 20),
  ('Хіп-хоп', 'hip-hop', 21),
  ('Поп', 'pop', 22),
  ('Інді', 'indie', 23),
  ('Саундтреки', 'soundtracks', 24),
  ('Реггі', 'reggae', 25),
  ('Ламповий звук', 'tube-sound', 26)
on conflict (slug) do nothing;
