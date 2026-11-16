-- Row Level Security policies (issue #5).
-- RLS was switched on for every table in the initial schema. These policies decide
-- who can see and change each row.
--
-- Summary
--   profiles      signed-in users can read profiles; you can only create/edit your own,
--                 and you cannot make yourself an admin or switch roles once chosen
--   companies     anyone can read; employers create their own; owners edit/delete; admins delete
--   jobs          anyone can read OPEN jobs; owners also see their closed jobs;
--                 owners create/edit/delete; admins can see and delete any job
--   skills        anyone can read; signed-in users can add; only admins edit/delete
--   job_skills    readable when the job is readable; job owners add/remove
--   applications  candidates see and create their own; employers see applicants to
--                 their jobs and can change only the stage
--
-- Note: (select auth.uid()) is wrapped in a subquery so Postgres runs it once per
-- query instead of once per row (recommended by Supabase for performance).

-- ---------------------------------------------------------------------------
-- Helper functions
-- They are SECURITY DEFINER so they can read profiles without triggering the
-- profiles policies again (which would cause infinite recursion).
-- ---------------------------------------------------------------------------

-- The role of the signed-in user (null if signed out or no role chosen yet).
create function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

-- True if the signed-in user is an admin.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

-- True if the signed-in user owns the company that posted this job.
create function public.owns_job(job uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.jobs j
    join public.companies c on c.id = j.company_id
    where j.id = job and c.owner_id = (select auth.uid())
  );
$$;

-- Only signed-in users need these helpers.
revoke execute on function public.current_user_role() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.owns_job(uuid) from public, anon;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.owns_job(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Role protection: users may pick candidate or employer ONCE (onboarding, #8).
-- They can never make themselves admin or switch roles afterwards.
-- Admins are assigned by the team in the Supabase dashboard (no signed-in user,
-- so auth.uid() is null and this check is skipped).
-- ---------------------------------------------------------------------------
create function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and new.role is distinct from old.role then
    if old.role is not null or new.role not in ('candidate', 'employer') then
      raise exception 'You cannot change your role.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();

-- New profiles cannot start as admin either.
create function public.protect_new_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and new.role = 'admin' then
    raise exception 'You cannot make yourself an admin.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_new_role before insert on public.profiles
  for each row execute function public.protect_new_profile_role();

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "Signed-in users can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------
create policy "Anyone can view companies"
  on public.companies for select
  to anon, authenticated
  using (true);

create policy "Employers can create their own companies"
  on public.companies for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and (select public.current_user_role()) = 'employer'
  );

create policy "Owners can update their companies"
  on public.companies for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners and admins can delete companies"
  on public.companies for delete
  to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- jobs
-- ---------------------------------------------------------------------------
create policy "Anyone can view open jobs"
  on public.jobs for select
  to anon, authenticated
  using (status = 'open');

create policy "Owners and admins can view all their jobs"
  on public.jobs for select
  to authenticated
  using (public.owns_job(id) or (select public.is_admin()));

create policy "Owners can create jobs for their companies"
  on public.jobs for insert
  to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = company_id and c.owner_id = (select auth.uid())
    )
  );

create policy "Owners can update their jobs"
  on public.jobs for update
  to authenticated
  using (public.owns_job(id))
  with check (
    exists (
      select 1 from public.companies c
      where c.id = company_id and c.owner_id = (select auth.uid())
    )
  );

create policy "Owners and admins can delete jobs"
  on public.jobs for delete
  to authenticated
  using (public.owns_job(id) or (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- skills
-- ---------------------------------------------------------------------------
create policy "Anyone can view skills"
  on public.skills for select
  to anon, authenticated
  using (true);

create policy "Signed-in users can add skills"
  on public.skills for insert
  to authenticated
  with check (true);

create policy "Admins can update skills"
  on public.skills for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete skills"
  on public.skills for delete
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- job_skills
-- The jobs table's own policies decide which jobs are visible, so a job's skills
-- are visible exactly when the job is.
-- ---------------------------------------------------------------------------
create policy "Job skills are visible when the job is visible"
  on public.job_skills for select
  to anon, authenticated
  using (exists (select 1 from public.jobs j where j.id = job_id));

create policy "Job owners can add skills to their jobs"
  on public.job_skills for insert
  to authenticated
  with check (public.owns_job(job_id));

create policy "Job owners can remove skills from their jobs"
  on public.job_skills for delete
  to authenticated
  using (public.owns_job(job_id));

-- ---------------------------------------------------------------------------
-- applications
-- ---------------------------------------------------------------------------
create policy "Candidates and job owners can view applications"
  on public.applications for select
  to authenticated
  using (candidate_id = (select auth.uid()) or public.owns_job(job_id));

create policy "Candidates can apply to open jobs"
  on public.applications for insert
  to authenticated
  with check (
    candidate_id = (select auth.uid())
    and (select public.current_user_role()) = 'candidate'
    and stage = 'applied'
    and exists (select 1 from public.jobs j where j.id = job_id and j.status = 'open')
  );

create policy "Job owners can update application stage"
  on public.applications for update
  to authenticated
  using (public.owns_job(job_id))
  with check (public.owns_job(job_id));

-- Employers may only change the stage column, never which job or candidate it is.
revoke update on public.applications from anon, authenticated;
grant update (stage) on public.applications to authenticated;
