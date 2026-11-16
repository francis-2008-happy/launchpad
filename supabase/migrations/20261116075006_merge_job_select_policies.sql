-- Merge the two SELECT policies on jobs for signed-in users into one (issue #5).
-- Same rules as before, but Postgres now checks one policy per row instead of two.
--   Signed out: can view open jobs.
--   Signed in:  can view open jobs, plus all jobs of their own companies; admins see all.

drop policy "Anyone can view open jobs" on public.jobs;
drop policy "Owners and admins can view all their jobs" on public.jobs;

create policy "Signed-out visitors can view open jobs"
  on public.jobs for select
  to anon
  using (status = 'open');

create policy "Signed-in users can view open jobs, their own jobs, or all if admin"
  on public.jobs for select
  to authenticated
  using (
    status = 'open'
    or private.owns_job(id)
    or (select private.is_admin())
  );
