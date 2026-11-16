-- Initial LaunchPad schema (issue #4).
-- Creates the Sprint 1 tables: profiles, companies, jobs, skills, job_skills, applications.
-- Row Level Security is switched on for every table. With no policies yet, nobody can
-- read or write these tables through the API. Issue #5 adds the access policies.

-- ---------------------------------------------------------------------------
-- Enums: fixed lists of allowed values, so the database rejects anything else.
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('candidate', 'employer', 'admin');
create type public.job_status as enum ('open', 'closed');
create type public.skill_category as enum ('language', 'framework', 'tool', 'practice');
create type public.application_stage as enum ('applied', 'reviewing', 'interviewing', 'offered', 'rejected');

-- ---------------------------------------------------------------------------
-- Helper: keeps an updated_at column current whenever a row changes.
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per user, linked to Supabase Auth's auth.users.
-- role stays null until the user picks one during onboarding (issue #8).
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role,
  full_name text,
  github_username text unique,
  avatar_url text,
  headline text,
  location text,
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- companies: owned by an employer profile.
-- ---------------------------------------------------------------------------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  website text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index companies_owner_id_idx on public.companies (owner_id);

-- ---------------------------------------------------------------------------
-- jobs: posted by a company.
-- ---------------------------------------------------------------------------
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 150),
  description text not null,
  location text,
  timezone text,
  is_remote boolean not null default false,
  status public.job_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_company_id_idx on public.jobs (company_id);
create index jobs_status_idx on public.jobs (status);

-- ---------------------------------------------------------------------------
-- skills: one shared list used by jobs (and later by candidate profiles).
-- ---------------------------------------------------------------------------
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category public.skill_category not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- job_skills: which skills each job requires. A job lists each skill only once.
-- ---------------------------------------------------------------------------
create table public.job_skills (
  job_id uuid not null references public.jobs (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  primary key (job_id, skill_id)
);

create index job_skills_skill_id_idx on public.job_skills (skill_id);

-- ---------------------------------------------------------------------------
-- applications: a candidate applying to a job. One application per job per candidate.
-- ---------------------------------------------------------------------------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  candidate_id uuid not null references public.profiles (id) on delete cascade,
  stage public.application_stage not null default 'applied',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);

create index applications_candidate_id_idx on public.applications (candidate_id);

-- ---------------------------------------------------------------------------
-- Keep updated_at current on tables that have it.
-- ---------------------------------------------------------------------------
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger companies_set_updated_at before update on public.companies
  for each row execute function public.set_updated_at();
create trigger jobs_set_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();
create trigger applications_set_updated_at before update on public.applications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: on for every table. Policies are added in issue #5.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.skills enable row level security;
alter table public.job_skills enable row level security;
alter table public.applications enable row level security;
