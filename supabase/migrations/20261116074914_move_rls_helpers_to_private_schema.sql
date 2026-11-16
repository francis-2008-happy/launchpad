-- Move the RLS helper functions out of the public API (issue #5).
-- Functions in the "public" schema can be called by anyone through the REST API
-- (/rest/v1/rpc/...). These helpers are only meant for our policies, so they move
-- to a "private" schema that the API does not expose.
-- Policies keep working: Postgres links policies to the function itself, not its name.

create schema if not exists private;

-- Signed-in users need USAGE so the policies (which run as that user) can call the helpers.
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.current_user_role() set schema private;
alter function public.is_admin() set schema private;
alter function public.owns_job(uuid) set schema private;

-- is_admin() refers to current_user_role() by name, so update it to the new schema.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_user_role() = 'admin', false);
$$;
