# launchpad

Proof-of-skill hiring platform that builds verified developer profiles from real GitHub code. Built with Next.js, TypeScript, and Supabase

## Getting started

You need [Node.js](https://nodejs.org) (LTS) and Git.

```bash
git clone https://github.com/francis-2008-happy/launchpad.git
cd launchpad
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # open http://localhost:3000
```

Other commands:

```bash
npm run lint    # check code style
npm run build   # production build (must pass before opening a PR)
npm test        # unit tests (Jest) for the logic in src/lib/
```

## Sample data

The skills list (about 70 languages, frameworks, tools, and practices) is added by a migration, so every environment has it.

To add sample jobs for testing job search, job details, and matching:

1. Sign in to LaunchPad as an employer and create your company profile.
2. Open `supabase/seed/sample-jobs.sql` and change `employer_github` to your GitHub username.
3. Run:

   ```bash
   npx supabase@3.1.0 db query --remote --yes -f supabase/seed/sample-jobs.sql
   ```

This adds 7 jobs (6 open, 1 closed) with required skills to your company. Running it again skips jobs that already exist.

## Project structure

```
src/
  app/          # pages and routes (Next.js App Router)
  components/   # shared UI components
  lib/          # helpers, Supabase clients, business logic
  types/        # shared TypeScript types
docs/           # project plan and proposal
```

## Favorite Quotes

**Francis Happy**

> “First, solve the problem. Then, write the code.” — John Johnson

**Godwin Akpan Essien**

> “The only way to learn a new programming language is by writing programs in it.” — Dennis Ritchie

**Maxwell Nvani**

> "First, do it. Then, do it right. Then, do it fast." — Kent Beck
