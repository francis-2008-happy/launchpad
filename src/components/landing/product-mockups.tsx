// Product "screenshots" for the landing page, built with HTML and Tailwind.
// They show what LaunchPad does: verified skills, match scores, and ranked
// applicants. All names and numbers are sample data; the photos are free
// Unsplash photos stored in public/images.
//
// They are pictures, not real controls, so each mockup is a <figure> with a
// text description for screen readers, and the inner content is aria-hidden.
import Image from "next/image";
import { CheckIcon, GitHubIcon, RepoIcon, SparklesIcon } from "@/components/icons";

// Sample people, matched to the photos in public/images/people.
// Each person has a 4:5 portrait (`photo`) and a square face crop (`avatar`).
// The crops were made ahead of time from high-resolution originals, so the
// browser never has to zoom in on a small part of a photo (which looks blurry).
export const people = {
  amara: { name: "Amara Okafor", photo: "/images/people/amara.jpg", avatar: "/images/people/amara-avatar.jpg" },
  maya: { name: "Maya Johnson", photo: "/images/people/maya.jpg", avatar: "/images/people/maya-avatar.jpg" },
  sofia: { name: "Sofia Ramirez", photo: "/images/people/sofia.jpg", avatar: "/images/people/sofia-avatar.jpg" },
  arjun: { name: "Arjun Mehta", photo: "/images/people/arjun.jpg", avatar: "/images/people/arjun-avatar.jpg" },
  daniel: { name: "Daniel Brooks", photo: "/images/people/daniel.jpg", avatar: "/images/people/daniel-avatar.jpg" },
};
type Person = (typeof people)[keyof typeof people];

// ---------- Small building blocks ----------

// A round photo avatar, using the square face crop.
export function Avatar({ person, size = 40 }: { person: Person; size?: number }) {
  return (
    <span className="relative block shrink-0 overflow-hidden rounded-full bg-surface" style={{ width: size, height: size }}>
      <Image src={person.avatar} alt="" fill sizes={`${size}px`} className="object-cover" />
    </span>
  );
}

// A circular progress ring showing a match percentage.
export function MatchRing({ value, size = 56 }: { value: number; size?: number }) {
  const radius = 15.5;
  const circumference = 2 * Math.PI * radius;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle cx="18" cy="18" r={radius} fill="none" stroke="var(--border)" strokeWidth="3.5" />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * circumference} ${circumference}`}
        />
      </svg>
      <span className="absolute text-[0.8em] font-bold">{value}%</span>
    </span>
  );
}

// The green "verified" badge used on skills.
export function VerifiedBadge({ label = "Verified" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-text">
      <CheckIcon className="h-3 w-3" />
      {label}
    </span>
  );
}

// ---------- Mockups ----------

const skills = [
  { name: "TypeScript", level: 92, repos: 4 },
  { name: "React", level: 88, repos: 6 },
  { name: "PostgreSQL", level: 74, repos: 3 },
  { name: "Testing (Jest)", level: 61, repos: 2 },
];

// A candidate's verified skill profile: the core idea of LaunchPad.
export function SkillProfileMockup({ className = "" }: { className?: string }) {
  return (
    <figure className={className}>
      <figcaption className="sr-only">
        Example candidate profile: each skill shows a verified badge and the number of GitHub repositories that prove it.
      </figcaption>
      <div aria-hidden="true" className="rounded-2xl border border-border bg-card p-5 shadow-[0_12px_32px_-12px_rgba(15,31,26,0.18)] sm:p-6">
        <div className="flex items-center gap-3">
          <Avatar person={people.amara} size={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{people.amara.name}</p>
            <p className="truncate text-sm text-muted">Frontend developer · Lagos, Nigeria</p>
          </div>
          <VerifiedBadge label="12 repos" />
        </div>

        <ul className="mt-5 space-y-3.5">
          {skills.map((skill) => (
            <li key={skill.name}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckIcon className="h-4 w-4 text-accent-text" />
                  {skill.name}
                </span>
                <span className="text-xs text-muted">{skill.repos} repos</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-primary" style={{ width: `${skill.level}%` }} />
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <GitHubIcon className="h-4 w-4 text-muted" />
          {["chat-app", "budget-tracker", "api-gateway"].map((repo) => (
            <span key={repo} className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 font-mono text-[11px] text-muted">
              <RepoIcon className="h-3 w-3" /> {repo}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}

const applicants = [
  { person: people.amara, skills: "TypeScript · React · SQL", match: 92 },
  { person: people.arjun, skills: "React · Node · Docker", match: 87 },
  { person: people.daniel, skills: "Vue · TypeScript", match: 74 },
];

// An employer's applicant list, ranked by proven-skill match.
export function ApplicantsMockup({ className = "" }: { className?: string }) {
  return (
    <figure className={className}>
      <figcaption className="sr-only">
        Example employer view: applicants for a Frontend Engineer job, ranked by how well their verified skills match.
      </figcaption>
      <div aria-hidden="true" className="rounded-2xl border border-border bg-card p-4 text-foreground shadow-[0_12px_32px_-12px_rgba(15,31,26,0.25)]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold">Frontend Engineer</p>
            <p className="text-xs text-muted">Ranked by verified skills</p>
          </div>
          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary-text">24 applicants</span>
        </div>
        <ul className="mt-3 divide-y divide-border">
          {applicants.map((a) => (
            <li key={a.person.name} className="flex items-center gap-3 py-2.5">
              <Avatar person={a.person} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{a.person.name}</p>
                <p className="truncate text-xs text-muted">{a.skills}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  a.match >= 85 ? "bg-accent-soft text-accent-text" : "bg-surface text-muted"
                }`}
              >
                {a.match}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}

// The AI explanation of a match. It explains; it does not decide.
export function MatchInsightMockup({ className = "" }: { className?: string }) {
  return (
    <figure className={className}>
      <figcaption className="sr-only">
        Example AI match insight: a 92 percent match with an explanation of strengths and one skill gap.
      </figcaption>
      <div aria-hidden="true" className="rounded-2xl border border-border bg-card p-4 text-foreground shadow-[0_12px_32px_-12px_rgba(15,31,26,0.25)]">
        <div className="flex items-center gap-3">
          <MatchRing value={92} size={48} />
          <div>
            <p className="flex items-center gap-1 text-sm font-bold">
              <SparklesIcon className="h-4 w-4 text-highlight" /> Why you match
            </p>
            <p className="text-xs text-muted">Frontend Engineer · Brightpath Labs</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-foreground">4 of 5 required skills</span> are proven in your projects.
          Missing: <span className="font-semibold text-foreground">Docker</span>. A small containerized project would
          close the gap.
        </p>
      </div>
    </figure>
  );
}
