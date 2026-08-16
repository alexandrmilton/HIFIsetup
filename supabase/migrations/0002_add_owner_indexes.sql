-- Existing linked project: add FK indexes flagged by the Supabase performance advisor.
create index if not exists setups_owner_idx on public.setups (owner_id);
create index if not exists components_submitted_by_idx on public.components (submitted_by);
