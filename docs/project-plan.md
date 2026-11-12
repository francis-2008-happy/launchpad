# LaunchPad Project Plan

C = core requirement (all must be completed). E = enhancement (at least one must be completed).

## Requirements and user stories

### 1. Accounts and Roles (C), lead Francis

Users sign in with GitHub through Supabase Auth. Each user has one role (candidate, employer, or admin) that controls which pages and data they can access, enforced with Row Level Security.

| Story | Description |
|---|---|
| Sign in | As a user, I want to sign in with my GitHub account so that I do not need a separate password. |
| Choose role | As a new user, I want to choose whether I am a candidate or an employer so that I see the right dashboard. |
| Protected pages | As a user, I want pages and data restricted to my role so that my information stays private. |
| Sign out | As a user, I want to sign out so that my account is safe on shared devices. |

### 2. GitHub Skill Profile (C), lead Maxwell

LaunchPad imports a candidate's public GitHub repositories, detects languages, frameworks, and testing practices, and builds a skill profile where each skill links back to the repositories that prove it.

| Story | Description |
|---|---|
| Import repos | As a candidate, I want LaunchPad to import my GitHub repositories so that I do not have to enter my projects by hand. |
| View skills | As a candidate, I want to see my detected skills with links to the code that proves them so that my profile is backed by evidence. |
| Feature projects | As a candidate, I want to choose and describe my best projects so that employers see my strongest work first. |
| Refresh profile | As a candidate, I want to re-import my repositories so that my profile stays current. |

Skill detection approach: languages come from the GitHub languages endpoint. Frameworks and tools come from dependency files such as `package.json`, `requirements.txt`, `*.csproj`, and `pom.xml`. Testing practice comes from test folders, test config files, and test dependencies. Each detected skill stores which repositories it came from.

### 3. Company and Job Posting (C), lead Godwin

Employers create a company profile and post jobs with a title, description, required skills, location, time zone, and remote option.

| Story | Description |
|---|---|
| Company profile | As an employer, I want to create a company profile with a name, logo, and description so that candidates know who is hiring. |
| Post a job | As an employer, I want to post a job with its required skills so that LaunchPad can match it with candidates. |
| Manage jobs | As an employer, I want to edit, close, or reopen my job posts so that my listings stay accurate. |

### 4. Job Search (C)

Candidates browse open jobs and narrow them down with search and filters.

| Story | Description |
|---|---|
| Browse jobs | As a candidate, I want to see a list of open jobs so that I can find opportunities. |
| Search and filter | As a candidate, I want to search by keyword and filter by skill, location, and remote option so that I only see relevant jobs. |
| Job details | As a candidate, I want to view a job's full details and company profile so that I can decide whether to apply. |

### 5. Applications and Tracking (C), lead Godwin

Candidates apply and track progress. Employers review applicants and move them through stages: applied, reviewing, interviewing, offered, rejected.

| Story | Description |
|---|---|
| Apply | As a candidate, I want to apply to a job with my LaunchPad profile so that applying is fast. |
| Track status | As a candidate, I want a dashboard of all my applications and their stage so that I always know where I stand. |
| Review applicants | As an employer, I want to see everyone who applied with their skill profiles so that I can evaluate them. |
| Update stage | As an employer, I want to move an applicant to a new stage so that the candidate knows the decision. |

### 6. AI Match Analysis (C), lead Francis

AI compares a candidate's proven skills with a job's requirements, produces a match score, explains strengths and gaps, and drafts a tailored resume summary. It runs only when requested.

| Story | Description |
|---|---|
| Analyze match | As a candidate, I want to see how well I match a job and why so that I apply where I have a real chance. |
| See gaps | As a candidate, I want to see which required skills I am missing so that I know what to learn next. |
| Tailored summary | As a candidate, I want AI to draft a resume summary for a specific job so that my application stands out. |
| Ranked applicants | As an employer, I want applicants ranked by match score with an explanation so that I can review the strongest first. |

Scoring approach: compute a deterministic base score in code from the overlap between required skills and proven skills (weighted by evidence such as number of repositories). The LLM explains the result and writes the summary. This keeps scores consistent and testable.

### Enhancements (E), in priority order

1. **Notifications.** Email when an application stage changes, and live dashboard updates with Supabase Realtime.
2. **Public Profile Link.** A shareable public page for a candidate's skill profile, viewable without signing in.
3. **AI Mock Interview.** Practice questions generated from a job description, with feedback on answers.
4. **Admin Moderation.** Admins review and remove suspicious companies or job posts.

## Sprint schedule

| Sprint | Week | Milestones |
|---|---|---|
| 1 | Week 3 | Project setup, Supabase, database schema with RLS, GitHub sign in, role selection, protected pages, base layout, company profile, job posting, Vercel deployment and CI |
| 2 | Week 4 | GitHub repository import and skill detection, skill profile with evidence links, featured projects, job search with filters, job details page |
| 3 | Week 5 | Applying, application tracking, applicant review and stage updates, AI match analysis, tailored summary, ranked applicants |
| 4 | Week 6 | At least one enhancement, unit and end-to-end tests, bug fixes, final deployment, README |
| Delivery | Week 7 | Demo video with every member presenting, submission worksheet |

All six core requirements should be complete by the end of Sprint 3.

## Architecture

LaunchPad is a responsive web application with a client-server, three-tier architecture.

- **Presentation tier.** Next.js and React pages styled with Tailwind, with separate dashboards for candidates, employers, and admins.
- **Application tier.** Next.js route handlers and server actions form our REST API, with a GitHub service (import and skill detection), a matching service (scoring), and an AI service (LLM calls).
- **Data tier.** Supabase PostgreSQL with Row Level Security, Supabase Auth with GitHub OAuth, and Supabase Storage for logos and resumes.
- **External services.** GitHub REST API and an LLM API. Results are cached in the database.

## Data model (starting point, refine in the schema task)

| Table | Purpose | Key fields |
|---|---|---|
| profiles | One row per user, linked to `auth.users` | id, role, full_name, github_username, avatar_url, headline, location, timezone |
| companies | Employer companies | id, owner_id, name, description, website, logo_url |
| jobs | Job posts | id, company_id, title, description, location, timezone, is_remote, status (open, closed) |
| skills | Shared skill list | id, name, category (language, framework, tool, practice) |
| job_skills | Required skills per job | job_id, skill_id |
| repositories | Imported GitHub repos | id, profile_id, github_id, name, url, description, languages, is_featured, imported_at |
| skill_evidence | Proof that a candidate has a skill | profile_id, skill_id, repository_id, source |
| applications | A candidate applying to a job | id, job_id, candidate_id, stage, created_at, updated_at |
| match_analyses | Cached AI results | id, job_id, candidate_id, score, strengths, gaps, summary, created_at |
