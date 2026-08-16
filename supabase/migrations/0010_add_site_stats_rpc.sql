-- Aggregate counts for the homepage stats strip. SECURITY DEFINER so the
-- profile/setup counts are visible without exposing the rows themselves.
create or replace function public.get_site_stats()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'setups', (select count(*) from public.setups where is_published),
    'users', (select count(*) from public.profiles),
    'components', (select count(*) from public.components),
    'added_this_week', (select count(*) from public.setups where is_published and created_at > now() - interval '7 days')
  );
$$;

revoke all on function public.get_site_stats() from public;
grant execute on function public.get_site_stats() to anon, authenticated;
