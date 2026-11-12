# LaunchPad Proposal

**Proof-of-skill hiring. Evidence over claims.**

Proposed by Francis Happy. Team members are Francis Happy, Maxwell Balla Nvani, and Godwin Akpan Essien.

## Purpose

Hiring is broken at the entry level. Talented developers around the world, from Lagos to Manila to São Paulo, can build real software but have no trusted way to prove it. Every resume lists the same skills, and AI-written resumes now make them all look equally polished. Employers posting remote roles receive hundreds of applications and cannot tell who can actually build without hours of interviews and take-home tests.

LaunchPad fixes this by replacing claims with evidence. Candidates connect their GitHub account, and LaunchPad analyzes their real repositories to build a verified skill profile where every skill links to the code that proves it. Employers post roles, see applicants ranked by how well their proven skills match, and review real work instead of guessing from a resume. AI explains each match, highlights skill gaps, and helps candidates tailor their application to every job.

## Core features

1. **Accounts and roles.** GitHub sign in through Supabase Auth, with candidate, employer, and admin roles.
2. **GitHub skill profile.** Imports repositories, detects languages, frameworks, and testing practices, and links each skill to the projects that prove it.
3. **Company and job posting.** Employers create a company profile and post roles with required skills, location, and time zone.
4. **Job search.** Candidates search and filter jobs by skill, location, and remote options.
5. **Applications and tracking.** Candidates apply and track every application. Employers move applicants through hiring stages.
6. **AI match analysis.** AI compares proven skills with job requirements, gives a match score, explains strengths and gaps, and drafts a tailored resume summary.

## Enhancements

AI mock interviews, notifications, a public profile link, and admin moderation.

## Technology

A responsive web app built with Next.js, React, TypeScript, and Tailwind, with Supabase for the database, authentication, and storage, the GitHub REST API, an LLM API, Jest and Playwright for testing, and Vercel for deployment.
