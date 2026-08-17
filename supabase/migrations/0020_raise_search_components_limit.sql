-- The manual-add search capped results at 20 (ceiling 50), hiding most of a
-- ~1700-row catalogue. Raise the default and ceiling so the picker's
-- scrollable results list can show a realistic match count.
--
-- Applied remotely as: raise_search_components_limit.

create or replace function public.search_components(p_query text, p_limit int default 200)
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
  limit least(greatest(coalesce(p_limit, 200), 1), 500);
$$;

grant execute on function public.search_components(text, int) to anon, authenticated;
