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
  c1 uuid; c2 uuid; j_open uuid; j_closed uuid; s1 uuid; app uuid;
  n int; failed boolean; r text := '';
begin
  -- Fixtures (as the database owner, no signed-in user)
  insert into auth.users (id, email, aud, role) values
    (cand,  'cand@test.local',  'authenticated', 'authenticated'),
    (emp,   'emp@test.local',   'authenticated', 'authenticated'),
    (emp2,  'emp2@test.local',  'authenticated', 'authenticated'),
    (adm,   'adm@test.local',   'authenticated', 'authenticated'),
    (fresh, 'fresh@test.local', 'authenticated', 'authenticated');
  -- Profiles are created automatically by the sign-up trigger (#6); set their roles here.
  insert into public.profiles (id, role, github_username) values
    (cand, 'candidate', 't_cand'), (emp, 'employer', 't_emp'), (emp2, 'employer', 't_emp2'),
    (adm, 'admin', 't_adm'), (fresh, null, 't_fresh')
  on conflict (id) do update set role = excluded.role, github_username = excluded.github_username;
  select count(*) into n from public.profiles where id in (cand, emp, emp2, adm, fresh);
  r := r || case when n = 5 then E'\nPASS ' else E'\nFAIL ' end || 'sign-up trigger created a profile for each new user (' || n || ')';
  insert into public.companies (owner_id, name) values (emp, 'Acme') returning id into c1;
  insert into public.companies (owner_id, name) values (emp2, 'Globex') returning id into c2;
  insert into public.jobs (company_id, title, description) values (c1, 'Open job', 'd') returning id into j_open;
  insert into public.jobs (company_id, title, description, status) values (c1, 'Closed job', 'd', 'closed') returning id into j_closed;
  insert into public.skills (name, category) values ('ZZ Test Skill', 'language') returning id into s1;
  insert into public.job_skills values (j_open, s1), (j_closed, s1);

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
  begin insert into public.skills (name, category) values ('anon skill', 'tool'); failed := false;
  exception when others then failed := true; end;
  r := r || case when failed then E'\nPASS ' else E'\nFAIL ' end || 'anon cannot add skills';
  reset role;

  -- ===== Candidate =====
  perform set_config('request.jwt.claims', json_build_object('sub', cand, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles where id in (cand, emp, emp2, adm, fresh);
  r := r || case when n = 5 then E'\nPASS ' else E'\nFAIL ' end || 'candidate can view profiles (' || n || ')';
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
  reset role;

  raise exception 'RESULT: % passed, % failed. Failures:%', (length(r) - length(replace(r, E'
PASS', ''))) / 5, (length(r) - length(replace(r, E'
FAIL', ''))) / 5, coalesce((select string_agg(l, ' | ') from unnest(string_to_array(r, E'
')) l where l like 'FAIL%'), ' none');
end
$t$;
rollback;
