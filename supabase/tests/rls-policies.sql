-- Row Level Security tests (issue #5).
-- Creates fake users, companies, jobs, and applications, then checks what each kind of
-- user can and cannot do. Everything runs in one transaction that is ROLLED BACK at the
-- end, so nothing is saved, even on the shared project database.
--
-- How to run (after `npx supabase@3.1.0 login` and `link`):
--   npx supabase@3.1.0 db query --remote --yes -f supabase/tests/rls-policies.sql
--
-- The command always "fails" on purpose: the final RAISE prints the result and rolls
-- everything back. Look for "RESULT: N passed, 0 failed" in the output.
-- Add a new check here whenever you add or change a policy.

begin;
do $t$
declare
  cand uuid := gen_random_uuid();
  emp uuid := gen_random_uuid();
  emp2 uuid := gen_random_uuid();
  adm uuid := gen_random_uuid();
  fresh uuid := gen_random_uuid();
  cand2 uuid := gen_random_uuid();
  c1 uuid; c2 uuid; j_open uuid; j_closed uuid; s1 uuid; s2 uuid; app uuid; rep1 uuid; rep2 uuid;
  n int; failed boolean; r text := '';
begin
  -- Fixtures (as the database owner, no signed-in user)
  insert into auth.users (id, email, aud, role) values
    (cand,  'cand@test.local',  'authenticated', 'authenticated'),
    (emp,   'emp@test.local',   'authenticated', 'authenticated'),
    (emp2,  'emp2@test.local',  'authenticated', 'authenticated'),
    (adm,   'adm@test.local',   'authenticated', 'authenticated'),
    (fresh, 'fresh@test.local', 'authenticated', 'authenticated'),
    (cand2, 'cand2@test.local', 'authenticated', 'authenticated');
  -- Profiles are created automatically by the sign-up trigger (#6); set their roles here.
  insert into public.profiles (id, role, github_username) values
    (cand, 'candidate', 't_cand'), (emp, 'employer', 't_emp'), (emp2, 'employer', 't_emp2'),
    (adm, 'admin', 't_adm'), (fresh, null, 't_fresh'), (cand2, 'candidate', 't_cand2')
  on conflict (id) do update set role = excluded.role, github_username = excluded.github_username;
  select count(*) into n from public.profiles where id in (cand, emp, emp2, adm, fresh, cand2);
  r := r || case when n = 6 then E'\nPASS ' else E'\nFAIL ' end || 'sign-up trigger created a profile for each new user (' || n || ')';
  insert into public.companies (owner_id, name) values (emp, 'Acme') returning id into c1;
  insert into public.companies (owner_id, name) values (emp2, 'Globex') returning id into c2;
  insert into public.jobs (company_id, title, description) values (c1, 'Open job', 'd') returning id into j_open;
  insert into public.jobs (company_id, title, description, status) values (c1, 'Closed job', 'd', 'closed') returning id into j_closed;
  insert into public.skills (name, category) values ('ZZ Test Skill', 'language') returning id into s1;
  insert into public.job_skills values (j_open, s1), (j_closed, s1);
  insert into public.skills (name, category) values ('ZZ Test Skill 2', 'framework') returning id into s2;
  -- Repositories and skill evidence (#36): one repository each for two candidates.
  insert into public.repositories (profile_id, github_id, name, url) values
    (cand, 1001, 'cand-repo', 'https://github.com/t_cand/cand-repo') returning id into rep1;
  insert into public.repositories (profile_id, github_id, name, url) values
    (cand2, 1002, 'cand2-repo', 'https://github.com/t_cand2/cand2-repo') returning id into rep2;
  insert into public.candidate_skills (profile_id, skill_id, repository_id, source) values
    (cand, s1, rep1, 'language'), (cand2, s1, rep2, 'language');

  -- ===== Signed out (anon) =====
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  select count(*) into n from public.jobs where company_id = c1;
  r := r || case when n = 1 then E'\nPASS ' else E'\nFAIL ' end || 'anon sees only the open job (' || n || ')';
  select count(*) into n from public.job_skills where skill_id = s1;
  r := r || case when n = 1 then E'\nPASS ' else E'\nFAIL ' end || 'anon sees skills only for open job (' || n || ')';
  select count(*) into n from public.companies where id in (c1, c2);
  r := r || case when n = 2 then E'\nPASS ' else E'\nFAIL ' end || 'anon can view companies (' || n || ')';
  select count(*) into n from public.profiles;
  r := r || case when n = 0 then E'\nPASS ' else E'\nFAIL ' end || 'anon cannot view profiles (' || n || ')';
  select count(*) into n from public.repositories;
  r := r || case when n = 0 then E'\nPASS ' else E'\nFAIL ' end || 'anon cannot view repositories' || ' (' || n || ')';
  select count(*) into n from public.candidate_skills;
  r := r || case when n = 0 then E'\nPASS ' else E'\nFAIL ' end || 'anon cannot view candidate skills' || ' (' || n || ')';
  begin insert into public.skills (name, category) values ('anon skill', 'tool'); failed := false;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'anon cannot add skills';
  reset role;

  -- ===== Candidate =====
  perform set_config('request.jwt.claims', json_build_object('sub', cand, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles where id in (cand, emp, emp2, adm, fresh, cand2);
  r := r || case when n = 6 then E'\nPASS ' else E'\nFAIL ' end || 'candidate can view profiles (' || n || ')';
  select count(*) into n from public.jobs where company_id = c1;
  r := r || case when n = 1 then E'\nPASS ' else E'\nFAIL ' end || 'candidate sees only open jobs (' || n || ')';
  begin insert into public.applications (job_id, candidate_id) values (j_open, cand) returning id into app; failed := false;
  exception when others then failed := true; end;
  r := r || case when not failed then E'\nPASS ' else E'\nFAIL ' end || 'candidate can apply to open job';
  begin insert into public.applications (job_id, candidate_id) values (j_closed, cand); failed := false;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'candidate cannot apply to closed job';
  begin insert into public.applications (job_id, candidate_id, stage) values (j_open, cand, 'offered'); failed := false;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'candidate cannot apply with a stage other than applied';
  begin insert into public.applications (job_id, candidate_id) values (j_open, emp); failed := false;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'candidate cannot apply as someone else';
  begin update public.applications set stage = 'offered' where id = app; get diagnostics n = row_count; failed := n = 0;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'candidate cannot change own application stage';
  begin insert into public.companies (owner_id, name) values (cand, 'Cand Co'); failed := false;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'candidate cannot create a company';
  begin update public.profiles set role = 'employer' where id = cand; failed := false;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'candidate cannot switch role';
  begin update public.profiles set headline = 'Hi' where id = cand; get diagnostics n = row_count; failed := n = 0;
  exception when others then failed := true; end;
  r := r || case when not failed then E'\nPASS ' else E'\nFAIL ' end || 'candidate can edit own profile';
  update public.profiles set headline = 'hacked' where id = emp; get diagnostics n = row_count;
  r := r || case when n = 0 then E'\nPASS ' else E'\nFAIL ' end || 'candidate cannot edit another profile';
  begin insert into public.skills (name, category) values ('ZZ Cand Skill', 'tool'); failed := false;
  exception when others then failed := true; end;
  r := r || case when not failed then E'\nPASS ' else E'\nFAIL ' end || 'signed-in user can add a skill';
  delete from public.skills where id = s1; get diagnostics n = row_count;
  r := r || case when n = 0 then E'\nPASS ' else E'\nFAIL ' end || 'non-admin cannot delete skills';
  -- Repositories and candidate skills (#36)
  select count(*) into n from public.repositories where profile_id in (cand, cand2);
  r := r || case when n = 1 then E'\nPASS ' else E'\nFAIL ' end || 'candidate sees only own repositories' || ' (' || n || ')';
  select count(*) into n from public.candidate_skills where profile_id in (cand, cand2);
  r := r || case when n = 1 then E'\nPASS ' else E'\nFAIL ' end || 'candidate sees only own skills' || ' (' || n || ')';
  begin insert into public.repositories (profile_id, github_id, name, url) values (cand, 1003, 'new-repo', 'https://github.com/t_cand/new-repo'); failed := false;
  exception when others then failed := true; end;
  r := r || case when not failed then E'\nPASS ' else E'\nFAIL ' end || 'candidate can import own repository';
  begin insert into public.repositories (profile_id, github_id, name, url) values (cand, 1001, 'dupe', 'https://github.com/t_cand/dupe'); failed := false;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'candidate cannot import the same GitHub repo twice';
  begin insert into public.repositories (profile_id, github_id, name, url) values (cand2, 1004, 'sneaky', 'https://github.com/x/sneaky'); failed := false;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'candidate cannot import a repository for someone else';
  begin insert into public.candidate_skills (profile_id, skill_id, repository_id, source) values (cand, s2, rep1, 'dependency'); failed := false;
  exception when others then failed := true; end;
  r := r || case when not failed then E'\nPASS ' else E'\nFAIL ' end || 'candidate can add a skill proved by own repository';
  begin insert into public.candidate_skills (profile_id, skill_id, repository_id, source) values (cand, s2, rep2, 'dependency'); failed := false;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'candidate cannot use another candidate''s repository as proof';
  update public.repositories set is_featured = true, featured_description = 'My best work' where id = rep1; get diagnostics n = row_count;
  r := r || case when n = 1 then E'\nPASS ' else E'\nFAIL ' end || 'candidate can feature own repository';
  update public.repositories set name = 'hacked' where id = rep2; get diagnostics n = row_count;
  r := r || case when n = 0 then E'\nPASS ' else E'\nFAIL ' end || 'candidate cannot edit another candidate''s repository';
  delete from public.candidate_skills where profile_id = cand2; get diagnostics n = row_count;
  r := r || case when n = 0 then E'\nPASS ' else E'\nFAIL ' end || 'candidate cannot delete another candidate''s skills';
  reset role;

  -- ===== Employer who owns the jobs =====
  perform set_config('request.jwt.claims', json_build_object('sub', emp, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.jobs where company_id = c1;
  r := r || case when n = 2 then E'\nPASS ' else E'\nFAIL ' end || 'owner sees own open and closed jobs (' || n || ')';
  select count(*) into n from public.applications where job_id = j_open;
  r := r || case when n = 1 then E'\nPASS ' else E'\nFAIL ' end || 'owner sees applicants to own job (' || n || ')';
  update public.applications set stage = 'reviewing' where id = app; get diagnostics n = row_count;
  r := r || case when n = 1 then E'\nPASS ' else E'\nFAIL ' end || 'owner can change application stage';
  begin update public.applications set candidate_id = emp where id = app; failed := false;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'owner cannot change application candidate';
  update public.jobs set title = 'Edited' where id = j_open; get diagnostics n = row_count;
  r := r || case when n = 1 then E'\nPASS ' else E'\nFAIL ' end || 'owner can edit own job';
  begin insert into public.jobs (company_id, title, description) values (c1, 'New', 'd'); failed := false;
  exception when others then failed := true; end;
  r := r || case when not failed then E'\nPASS ' else E'\nFAIL ' end || 'owner can post job for own company';
  begin insert into public.jobs (company_id, title, description) values (c2, 'Sneaky', 'd'); failed := false;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'employer cannot post job for another company';
  begin update public.jobs set company_id = c2 where id = j_open; failed := false;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'owner cannot move job to another company';
  update public.companies set name = 'Hacked' where id = c2; get diagnostics n = row_count;
  r := r || case when n = 0 then E'\nPASS ' else E'\nFAIL ' end || 'employer cannot edit another company';
  begin insert into public.companies (owner_id, name) values (emp2, 'Fake'); failed := false;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'employer cannot create company for someone else';
  select count(*) into n from public.repositories where profile_id = cand;
  r := r || case when n = 2 then E'\nPASS ' else E'\nFAIL ' end || 'employer sees repositories of own applicant' || ' (' || n || ')';
  select count(*) into n from public.candidate_skills where profile_id = cand;
  r := r || case when n = 2 then E'\nPASS ' else E'\nFAIL ' end || 'employer sees skills of own applicant' || ' (' || n || ')';
  select count(*) into n from public.repositories where profile_id = cand2;
  r := r || case when n = 0 then E'\nPASS ' else E'\nFAIL ' end || 'employer cannot see repositories of a non-applicant' || ' (' || n || ')';
  update public.repositories set name = 'hacked' where id = rep1; get diagnostics n = row_count;
  r := r || case when n = 0 then E'\nPASS ' else E'\nFAIL ' end || 'employer cannot edit applicant repository';
  begin insert into public.repositories (profile_id, github_id, name, url) values (emp, 2001, 'emp-repo', 'https://github.com/t_emp/emp-repo'); failed := false;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'employer cannot import repositories';
  reset role;

  -- ===== Another employer =====
  perform set_config('request.jwt.claims', json_build_object('sub', emp2, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.jobs where id = j_closed;
  r := r || case when n = 0 then E'\nPASS ' else E'\nFAIL ' end || 'other employer cannot see closed job of other company (' || n || ')';
  select count(*) into n from public.applications;
  r := r || case when n = 0 then E'\nPASS ' else E'\nFAIL ' end || 'other employer cannot see other company applicants (' || n || ')';
  update public.jobs set title = 'Hacked' where id = j_open; get diagnostics n = row_count;
  r := r || case when n = 0 then E'\nPASS ' else E'\nFAIL ' end || 'other employer cannot edit job';
  delete from public.jobs where id = j_open; get diagnostics n = row_count;
  r := r || case when n = 0 then E'\nPASS ' else E'\nFAIL ' end || 'other employer cannot delete job';
  begin insert into public.job_skills values (j_open, s1); failed := false;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'other employer cannot add skills to job';
  select count(*) into n from public.repositories where profile_id in (cand, cand2);
  r := r || case when n = 0 then E'\nPASS ' else E'\nFAIL ' end || 'other employer cannot see repositories of candidates who did not apply' || ' (' || n || ')';
  reset role;

  -- ===== New user with no role yet =====
  perform set_config('request.jwt.claims', json_build_object('sub', fresh, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin update public.profiles set role = 'admin' where id = fresh; failed := false;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'new user cannot make themselves admin';
  begin update public.profiles set role = 'employer' where id = fresh; get diagnostics n = row_count; failed := n = 0;
  exception when others then failed := true; end;
  r := r || case when not failed then E'\nPASS ' else E'\nFAIL ' end || 'new user can pick employer once';
  begin update public.profiles set role = 'candidate' where id = fresh; failed := false;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'user cannot switch role after picking';
  reset role;

  -- ===== Admin =====
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.jobs where company_id = c1;
  r := r || case when n = 3 then E'\nPASS ' else E'\nFAIL ' end || 'admin sees all jobs incl. closed (' || n || ')';
  delete from public.jobs where id = j_closed; get diagnostics n = row_count;
  r := r || case when n = 1 then E'\nPASS ' else E'\nFAIL ' end || 'admin can delete a job';
  update public.companies set name = 'Admin edit' where id = c1; get diagnostics n = row_count;
  r := r || case when n = 0 then E'\nPASS ' else E'\nFAIL ' end || 'admin cannot edit company details';
  select count(*) into n from public.repositories where profile_id in (cand, cand2);
  r := r || case when n = 3 then E'\nPASS ' else E'\nFAIL ' end || 'admin sees all repositories' || ' (' || n || ')';
  reset role;

  -- E'\n' (an escaped line break) works no matter how the file's own line breaks are saved.
  raise exception 'RESULT: % passed, % failed. Failures:%',
    (length(r) - length(replace(r, E'\nPASS', ''))) / 5,
    (length(r) - length(replace(r, E'\nFAIL', ''))) / 5,
    coalesce((select string_agg(l, ' | ') from unnest(string_to_array(r, E'\n')) l where l like 'FAIL%'), ' none');
end
$t$;
rollback;
