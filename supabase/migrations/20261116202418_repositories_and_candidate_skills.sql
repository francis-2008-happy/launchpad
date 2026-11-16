-- Tables for the GitHub skill profile (issue #36).
--
--   repositories      a candidate's imported GitHub repositories (#39)
--   candidate_skills  the skills each repository proves (#40). One row per
--                     skill per repository, so "React, proved by chat-app and
--                     budget-tracker" is two rows. The profile page groups them
--                     by skill to show the evidence links (#41).
--
-- Who can see what (Row Level Security)
--   Candidates   see and manage only their own rows
--   Employers    can read the rows of candidates who applied to one of their jobs
--   Admins       can read everything
--   Signed out   nothing

-- How a skill was detected (see "Skill detection approach" in docs/project-plan.md).
create type public.skill_source as enum (
  'language',    -- from the GitHub languages endpoint
  'dependency',  -- from a dependency file such as package.json or requirements.txt
  'tests'        -- from test folders, test config files, or test dependencies
);

-- ---------------------------------------------------------------------------
-- repositories
-- ---------------------------------------------------------------------------
create table public.repositories (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  github_id bigint not null,                -- GitHub's own id, stays the same if the repo is renamed
  name text not null,
  url text not null,
  description text,
  primary_language text,
  stars integer not null default 0 check (stars >= 0),
  pushed_at timestamptz,                    -- last push on GitHub
  is_featured boolean not null default false,
  featured_description text check (char_length(featured_description) <= 500),
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Re-importing updates the same row instead of adding a duplicate.
  unique (profile_id, github_id),
  -- Lets candidate_skills check that a repository belongs to the same candidate (below).
  unique (id, profile_id)
);

create index repositories_profile_id_idx on public.repositories (profile_id);

create trigger repositories_set_updated_at before update on public.repositories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- candidate_skills
-- ---------------------------------------------------------------------------
create table public.candidate_skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  repository_id uuid not null,
  source public.skill_source not null,
  created_at timestamptz not null default now(),
  -- A repository proves each skill only once.
  unique (repository_id, skill_id),
  -- The repository must belong to the same candidate. This stops anyone from
  -- using someone else's repository as proof of their own skill.
  foreign key (repository_id, profile_id) references public.repositories (id, profile_id) on delete cascade
);

create index candidate_skills_profile_id_idx on public.candidate_skills (profile_id);
create index candidate_skills_skill_id_idx on public.candidate_skills (skill_id);

-- ---------------------------------------------------------------------------
-- Helper: true if this candidate applied to a job posted by the signed-in user.
-- SECURITY DEFINER so it can look at applications and jobs without those
-- tables' own policies getting in the way. It lives in the private schema
-- (like the other helpers) so it is not exposed through the API.
-- ---------------------------------------------------------------------------
create function private.applied_to_my_jobs(candidate uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where a.candidate_id = candidate and c.owner_id = (select auth.uid())
  );
$$;

revoke execute on function private.applied_to_my_jobs(uuid) from public, anon;
grant execute on function private.applied_to_my_jobs(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.repositories enable row level security;
alter table public.candidate_skills enable row level security;

-- repositories
create policy "Candidates, their employers, and admins can view repositories"
  on public.repositories for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    or private.applied_to_my_jobs(profile_id)
    or (select private.is_admin())
  );

create policy "Candidates can import their own repositories"
  on public.repositories for insert
  to authenticated
  with check (
    profile_id = (select auth.uid())
    and (select private.current_user_role()) = 'candidate'
  );

create policy "Candidates can update their own repositories"
  on public.repositories for update
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "Candidates can delete their own repositories"
  on public.repositories for delete
  to authenticated
  using (profile_id = (select auth.uid()));

-- candidate_skills
create policy "Candidates, their employers, and admins can view candidate skills"
  on public.candidate_skills for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    or private.applied_to_my_jobs(profile_id)
    or (select private.is_admin())
  );

create policy "Candidates can add their own skills"
  on public.candidate_skills for insert
  to authenticated
  with check (
    profile_id = (select auth.uid())
    and (select private.current_user_role()) = 'candidate'
  );

create policy "Candidates can update their own skills"
  on public.candidate_skills for update
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "Candidates can delete their own skills"
  on public.candidate_skills for delete
  to authenticated
  using (profile_id = (select auth.uid()));
