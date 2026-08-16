-- 1. The (brand, model) unique constraint was case-sensitive, so a member
--    adding "Debut Pro" created a second row next to the seeded "Debut PRO".
--    Fold duplicates onto the oldest row and make uniqueness case-insensitive.
-- 2. Component search used order(brand).limit(8); once a brand had 36 rows a
--    newly added component fell outside the window and looked "missing".
--    search_components() ranks exact/prefix matches first.
-- 3. Generic category names refined ("Програвач" -> "Вініловий програвач").
-- 4. setup_components.is_extra separates gear outside the main signal chain.
--
-- Applied remotely as: fix_component_search_and_dedupe,
-- refine_component_categories, add_extra_components_flag.

alter table public.components drop constraint if exists components_brand_model_key;
create unique index if not exists components_brand_model_ci_idx
  on public.components (lower(brand), lower(model));

alter table public.setup_components add column if not exists is_extra boolean not null default false;

create or replace function public.search_components(p_query text, p_limit int default 20)
returns table (id uuid, brand text, model text, category text, origin public.component_origin, image_url text)
language sql
stable
set search_path = public
as $$
  select c.id, c.brand, c.model, c.category, c.origin, c.image_url
  from public.components c
  where p_query is null or btrim(p_query) = ''
     or (c.brand || ' ' || c.model) ilike '%' || btrim(p_query) || '%'
     or c.brand ilike '%' || btrim(p_query) || '%'
     or c.model ilike '%' || btrim(p_query) || '%'
  order by
    case
      when lower(c.brand || ' ' || c.model) = lower(btrim(p_query)) then 0
      when lower(c.brand || ' ' || c.model) like lower(btrim(p_query)) || '%' then 1
      when lower(c.model) like lower(btrim(p_query)) || '%' then 2
      when lower(c.brand) like lower(btrim(p_query)) || '%' then 3
      else 4
    end,
    c.brand, c.model
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

grant execute on function public.search_components(text, int) to anon, authenticated;
