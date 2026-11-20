-- Sample jobs for development and testing (issue #37).
--
-- Adds 7 varied jobs (6 open, 1 closed) with required skills to ONE employer's
-- existing company, so job search, job details, and matching have realistic
-- data to show. It does not create fake users or companies.
--
-- How to run it (see "Sample data" in the README):
--   1. Sign in to LaunchPad as an employer and create your company profile.
--   2. Change the GitHub username below to yours.
--   3. Run: npx supabase@3.1.0 db query --remote --yes -f supabase/seed/sample-jobs.sql
--
-- Safe to run more than once: a job is skipped if the company already has a job
-- with the same title. Skills are looked up by name in the skills list (#47).

do $seed$
declare
  employer_github text := 'pearlrhema';  -- <-- change this to your GitHub username
  company uuid;
  new_job uuid;
  added int := 0;
  job record;
begin
  select c.id into company
  from public.companies c
  join public.profiles p on p.id = c.owner_id
  where p.github_username = employer_github and p.role = 'employer'
  order by c.created_at
  limit 1;

  if company is null then
    raise exception 'No company found for employer "%". Sign in as an employer and create a company profile first.', employer_github;
  end if;

  for job in
    select * from (values
      (
        'Full-Stack Developer (Next.js)',
        'Build features end to end in our Next.js and Supabase app: database tables, server actions, and the pages that use them. You will own small features from idea to release and review your teammates'' pull requests.' || chr(10) || chr(10) ||
        'You have shipped at least one full-stack project with TypeScript and a SQL database, and you write tests for the logic you build.',
        null, true, 'open',
        array['TypeScript', 'Next.js', 'PostgreSQL', 'Supabase', 'Tailwind CSS', 'Unit testing']
      ),
      (
        'Mobile Developer (Flutter)',
        'Help us build the Android and iOS app our customers use to book and pay for appointments. You will work on new screens, offline support, and push notifications.' || chr(10) || chr(10) ||
        'You have published or built a real Flutter app and are comfortable working with REST APIs.',
        'Accra, Ghana', false, 'open',
        array['Dart', 'Flutter', 'Firebase', 'REST APIs', 'Git']
      ),
      (
        'Data Analyst',
        'Turn our booking and payment data into dashboards and insights the team uses every week. You will write SQL, clean data with Python, and present what you find.' || chr(10) || chr(10) ||
        'A GitHub project with a real data analysis (notebooks welcome) is the best way to show us your work.',
        'Nairobi, Kenya', true, 'open',
        array['Python', 'SQL', 'Data analysis', 'PostgreSQL']
      ),
      (
        'DevOps Engineer',
        'Keep our services fast and reliable. You will improve our CI/CD pipeline, containerize services, and manage our cloud infrastructure.' || chr(10) || chr(10) ||
        'You have set up a CI pipeline and deployed containers to the cloud, even on a personal project.',
        null, true, 'open',
        array['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'GitHub Actions', 'Linux']
      ),
      (
        'Python Backend Developer',
        'Design and build the APIs behind our platform with Django and PostgreSQL. You will model data, write endpoints, and keep them well tested.' || chr(10) || chr(10) ||
        'You have built a REST API with Python and care about clean, tested code.',
        'Lagos, Nigeria', false, 'open',
        array['Python', 'Django', 'PostgreSQL', 'REST APIs', 'Unit testing', 'Docker']
      ),
      (
        'Junior Software Engineer (Graduate)',
        'Our graduate role for developers early in their career. You will pair with senior engineers, fix bugs, and build small features in our React web app while learning how a product team works.' || chr(10) || chr(10) ||
        'Personal or school projects on GitHub count. We care more about what you have built than where you studied.',
        'Salt Lake City, Utah', true, 'open',
        array['JavaScript', 'React', 'HTML', 'CSS', 'Git', 'Code review']
      ),
      (
        'QA Automation Engineer',
        'Write automated tests that catch bugs before our customers do. You will build end-to-end tests and help the team test earlier.' || chr(10) || chr(10) ||
        'This role is filled. It is kept as a closed job for testing.',
        null, true, 'closed',
        array['TypeScript', 'Playwright', 'Jest', 'End-to-end testing', 'CI/CD']
      )
    ) as t(title, description, location, is_remote, status, skill_names)
  loop
    if exists (select 1 from public.jobs where company_id = company and title = job.title) then
      continue;  -- already added on an earlier run
    end if;

    insert into public.jobs (company_id, title, description, location, is_remote, status)
    values (company, job.title, job.description, job.location, job.is_remote, job.status::public.job_status)
    returning id into new_job;

    insert into public.job_skills (job_id, skill_id)
    select new_job, s.id from public.skills s where s.name = any (job.skill_names);

    added := added + 1;
  end loop;

  raise notice 'Added % sample jobs for %.', added, employer_github;
end
$seed$;
