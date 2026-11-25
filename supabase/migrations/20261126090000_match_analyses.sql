-- Match analyses (issue #69).
-- Caches one AI match analysis per candidate per job, so we only call the AI again
-- when the candidate's skills or the job's required skills change.
--
-- Who can do what:
--   candidates  read their own analyses
--   employers   read analyses for candidates who applied to one of their jobs
--   admins      read everything
--   nobody      inserts, updates, or deletes through the API
--
-- Why no write policies: the score must come from our scoring code (src/lib/matching),
-- never from the browser. If candidates could write rows, they could save a score of 100
-- for themselves. Row Level Security cannot check where a number came from, so only our
-- server code writes this table, using the secret key (src/lib/supabase/admin.ts).
--
-- The existing applications policies (20261116074450_rls_policies.sql) already cover
-- applying (insert), viewing (select), and stage updates (update of stage only), so
-- they are unchanged.

create table public.match_analyses (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  candidate_id uuid not null references public.profiles (id) on delete cascade,
  -- 0 to 100, computed in code from proven skills. The AI never sets it.
  score smallint not null check (score between 0 and 100),
  -- Required skills the candidate has proven, e.g. [{"skill": "React", "repositories": 3}]
  strengths jsonb not null default '[]'::jsonb,
  -- Required skills the candidate has not proven yet, e.g. [{"skill": "Docker"}]
  gaps jsonb not null default '[]'::jsonb,
  -- AI-written explanation of the score.
  explanation text not null,
  -- AI-drafted resume summary for this job (#78). Null until the candidate asks for one.
  summary text,
  -- A hash of the job's required skills and the candidate's skill evidence when this
  -- analysis was made. If either changes, the hash changes and the analysis is out of date.
  skills_fingerprint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One cached analysis per candidate per job. Refreshing replaces it.
  unique (job_id, candidate_id)
);

create index match_analyses_candidate_id_idx on public.match_analyses (candidate_id);

create trigger match_analyses_set_updated_at before update on public.match_analyses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.match_analyses enable row level security;

create policy "Candidates, employers of applicants, and admins can view match analyses"
  on public.match_analyses for select
  to authenticated
  using (
    candidate_id = (select auth.uid())
    or (
      -- The employer owns the job AND this candidate applied to it.
      private.owns_job(job_id)
      and exists (
        select 1 from public.applications a
        where a.job_id = match_analyses.job_id
          and a.candidate_id = match_analyses.candidate_id
      )
    )
    or (select private.is_admin())
  );

-- Extra safety on top of RLS: signed-in and signed-out users can only read this table.
revoke insert, update, delete on public.match_analyses from anon, authenticated;
