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
```

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
