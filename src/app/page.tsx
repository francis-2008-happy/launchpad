// Landing page (/). Explains LaunchPad to visitors and leads them to sign in.
// It is a Server Component. Only the sign-in button reads the session, so that
// button is wrapped in <Suspense> and the rest of the page is pre-rendered.
//
// Layout is mobile-first: everything stacks in one column on phones, and the
// `sm:`, `md:`, and `lg:` classes add columns as the screen gets wider.
//
// Photos are free Unsplash photos (Unsplash License, no attribution required),
// cropped and saved in public/images/people. Amara, Maya, and Sofia are from
// the #WOCinTech Chat collection; Arjun is by litoon dev; Daniel is by
// The Connected Narrative.
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { PrimaryCta, PrimaryCtaSkeleton } from "@/components/landing/primary-cta";
import {
  ApplicantsMockup,
  MatchInsightMockup,
  SkillProfileMockup,
  people,
} from "@/components/landing/product-mockups";
import { CandidateDashboardScreen, LaptopFrame } from "@/components/landing/device-mockups";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";
import { AudienceSwitch } from "@/components/landing/audience-switch";
import { Reveal } from "@/components/landing/reveal";
import { GitHubPreview } from "@/components/landing/github-preview";

// Shared width and side padding for every section.
const container = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

export default function HomePage() {
  return (
    <main className="overflow-x-clip">
      <Hero />
      {/* Each section below fades in as it scrolls into view (issue #29). */}
      <Reveal>
        <HowItWorks />
      </Reveal>
      <Reveal>
        <TryIt />
      </Reveal>
      <Reveal>
        <Audiences />
      </Reveal>
      <Reveal>
        <ProfileSpotlight />
      </Reveal>
      <Reveal>
        <Faq />
      </Reveal>
      <Reveal>
        <FinalCta />
      </Reveal>
    </main>
  );
}

// ---------- Hero ----------
// The hero has two versions, one for developers and one for employers, and a
// switch at the top to change between them (issue #29). Both are built here on
// the server; <AudienceSwitch> only chooses which one to show.

type PersonKey = keyof typeof people;

type Tile = {
  person: PersonKey;
  aspect: string;
  label: React.ReactNode;
  detail: string; // extra words that slide out of the label on hover
  labelPosition?: "top" | "bottom";
};

// A photo of a person with a small label on top, like a profile preview.
// On hover it lifts slightly and the label shows more detail (issue #29).
function PhotoTile({ person, aspect, label, detail, labelPosition = "bottom" }: Tile) {
  const p = people[person];
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-surface transition duration-300 hover:shadow-[0_18px_40px_-18px_rgba(15,31,26,0.45)] motion-safe:hover:-translate-y-1 ${aspect}`}
    >
      <Image
        src={p.photo}
        alt={`${p.name}, a developer, at a laptop`}
        fill
        sizes="(min-width: 1024px) 18rem, 45vw"
        preload // load right away: these photos are at the top of the page
        className="object-cover object-[center_30%]"
      />
      <span
        className={`absolute left-2 ${labelPosition === "top" ? "top-2" : "bottom-2"} inline-flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-panel shadow-sm sm:left-3 sm:text-xs`}
      >
        {label}
        {/* Hidden until hover: grows open from zero width. */}
        <span className="max-w-0 overflow-hidden whitespace-nowrap font-medium text-muted transition-[max-width] duration-500 group-hover:max-w-48">
          &nbsp;· {detail}
        </span>
      </span>
    </div>
  );
}

const check = <CheckIcon className="h-3.5 w-3.5 text-accent-text" />;
const dot = <span className="h-2 w-2 rounded-full bg-accent" />;

// Developers see verified skills; employers see match scores for the same people.
const tiles: Record<"developer" | "employer", [Tile[], Tile[]]> = {
  developer: [
    [
      { person: "arjun", aspect: "aspect-[4/5]", label: <>{check} React · 6 repos</>, detail: "chat-app, budget-tracker" },
      { person: "sofia", aspect: "aspect-square", label: <>{check} PostgreSQL</>, detail: "3 repos" },
    ],
    [
      { person: "maya", aspect: "aspect-square", labelPosition: "top", label: <>{dot} 92% match</>, detail: "Frontend Engineer" },
      { person: "daniel", aspect: "aspect-[4/5]", label: <>{check} TypeScript · 4 repos</>, detail: "api-gateway" },
    ],
  ],
  employer: [
    [
      { person: "arjun", aspect: "aspect-[4/5]", label: <>{dot} 87% match</>, detail: "React, Node, Docker" },
      { person: "sofia", aspect: "aspect-square", label: <>{dot} 81% match</>, detail: "SQL, Python" },
    ],
    [
      { person: "maya", aspect: "aspect-square", labelPosition: "top", label: <>{dot} 92% match</>, detail: "4 of 5 skills" },
      { person: "daniel", aspect: "aspect-[4/5]", label: <>{dot} 74% match</>, detail: "Vue, TypeScript" },
    ],
  ],
};

function PhotoCollage({ audience }: { audience: "developer" | "employer" }) {
  const [left, right] = tiles[audience];
  return (
    <div className="relative isolate">
      <div aria-hidden="true" className="absolute inset-y-8 -right-4 left-10 -z-10 rounded-[2rem] bg-primary-soft sm:-right-8" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="mt-10 space-y-3 sm:space-y-4">
          {left.map((tile) => (
            <PhotoTile key={tile.person} {...tile} />
          ))}
        </div>
        <div className="space-y-3 sm:space-y-4">
          {right.map((tile) => (
            <PhotoTile key={tile.person} {...tile} />
          ))}
        </div>
      </div>
      {/* Employers also see the ranked applicant list, floating over the photos. */}
      {audience === "employer" && (
        <ApplicantsMockup className="relative z-10 mx-2 -mt-28 sm:mx-auto sm:max-w-sm" />
      )}
    </div>
  );
}

// The text and buttons for one audience.
const heroCopy = {
  developer: {
    badge: "For junior and self-taught developers",
    before: "Get hired for the code you’ve ",
    highlight: "already written.",
    text: "LaunchPad turns your GitHub into a verified skill profile. Employers see what you’ve actually built, and you see exactly why you match each job.",
    ctaLabel: "Sign in with GitHub",
    secondary: { href: "#for-employers", label: "I’m hiring" },
    browseJobs: true, // "Just looking? Browse open jobs" link (issue #67)
    points: ["No résumé upload", "Every skill linked to real code", "AI explains, people decide"],
  },
  employer: {
    badge: "For hiring teams",
    before: "Hire developers on ",
    highlight: "proven skills.",
    text: "Post a job with the skills you need. LaunchPad ranks applicants by the skills verified in their GitHub code and explains every match, so you can shortlist with confidence.",
    ctaLabel: "Sign in to post a job",
    secondary: { href: "#employers", label: "See what you get" },
    browseJobs: false,
    points: ["Applicants ranked by verified skills", "Open the code behind any skill", "AI explains, you decide"],
  },
};

function HeroContent({ audience }: { audience: "developer" | "employer" }) {
  const copy = heroCopy[audience];
  return (
    <div className="mt-8 grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
      {/* Text */}
      <div>
        <p className="inline-flex items-center gap-2 rounded-full bg-highlight-soft px-3 py-1 text-sm font-semibold text-foreground">
          <span className="h-2 w-2 rounded-full bg-highlight" />
          {copy.badge}
        </p>

        <h1 className="mt-6 text-[clamp(2.4rem,4.2vw+1rem,4.25rem)] leading-[1.05] font-extrabold tracking-tight text-balance">
          {copy.before}
          <span className="relative isolate whitespace-nowrap">
            {/* A marker-style highlight behind the words */}
            <span aria-hidden="true" className="absolute inset-x-0 bottom-[0.08em] -z-10 h-[0.35em] rounded-sm bg-highlight/60" />
            {copy.highlight}
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-pretty text-muted sm:text-xl">{copy.text}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Suspense fallback={<PrimaryCtaSkeleton />}>
            <PrimaryCta signedOutLabel={copy.ctaLabel} />
          </Suspense>
          {/* A plain <a> (not <Link>) for in-page "#..." links: the browser then fires a
              "hashchange" event, which the audience switch listens for. */}
          <a
            href={copy.secondary.href}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-base font-semibold transition hover:border-primary hover:text-primary-text"
          >
            {copy.secondary.label}
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>

        {/* Developers can look at jobs before signing in (issue #67). */}
        {copy.browseJobs && (
          <p className="mt-4 text-sm text-muted">
            Just looking?{" "}
            <Link href="/jobs" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline-offset-4 hover:underline">
              Browse open jobs
            </Link>
          </p>
        )}

        <ul className="mt-8 grid gap-2 text-sm text-muted sm:flex sm:flex-wrap sm:gap-x-6">
          {copy.points.map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <CheckIcon className="h-4 w-4 text-accent-text" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Photo collage: real people, each with a verified skill or match label. */}
      <PhotoCollage audience={audience} />
    </div>
  );
}

function Hero() {
  return (
    // The id lets every "I'm hiring" link (href="#for-employers") scroll here and switch to the employer view.
    <section id="for-employers" className={`${container} scroll-mt-20 pt-8 pb-16 sm:pt-12 lg:pt-16 lg:pb-24`}>
      <AudienceSwitch developer={<HeroContent audience="developer" />} employer={<HeroContent audience="employer" />} />
    </section>
  );
}

// ---------- Shared section heading ----------

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-bold text-primary-text">{eyebrow}</p>
      <h2 className="mt-2 text-[clamp(1.875rem,2.2vw+1rem,2.75rem)] leading-tight font-extrabold tracking-tight text-balance">
        {title}
      </h2>
      {text && <p className="mt-4 text-lg text-pretty text-muted">{text}</p>}
    </div>
  );
}

// ---------- How it works ----------

const steps = [
  {
    title: "Sign in with GitHub",
    text: "One click. No forms to fill in and no résumé to upload. LaunchPad reads your public repositories.",
  },
  {
    title: "Get your verified profile",
    text: "We find the languages, frameworks, and practices you use, and link every skill to the repos that prove it.",
  },
  {
    title: "Apply and see why you match",
    text: "Each job shows your match score, your strengths, and the one or two skills that would close the gap.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-surface py-20 sm:py-24">
      <div className={container}>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <SectionHeading
            eyebrow="How it works"
            title="From GitHub to your first interview"
            text="Your code already shows what you can do. LaunchPad puts it in front of the people hiring."
          />

          <ol className="divide-y divide-border border-y border-border">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-5 py-6 sm:gap-8">
                <span className="w-10 shrink-0 font-mono text-2xl font-bold text-primary-text sm:text-3xl">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-bold sm:text-xl">{step.title}</h3>
                  <p className="mt-1.5 text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Product picture: the candidate dashboard on a laptop. */}
        <figure className="mx-auto mt-16 max-w-4xl sm:mt-20">
          <figcaption className="sr-only">The LaunchPad candidate dashboard on a laptop.</figcaption>
          <LaptopFrame>
            <CandidateDashboardScreen />
          </LaptopFrame>
        </figure>
      </div>
    </section>
  );
}

// ---------- Try it with a GitHub username (issue #34) ----------

function TryIt() {
  return (
    <section id="try-it" className="scroll-mt-20 py-20 sm:py-24">
      <div className={`${container} grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16`}>
        <SectionHeading
          eyebrow="Try it now"
          title="See what your GitHub says about you"
          text="Type any GitHub username for a quick preview of the languages and projects behind it. No sign in needed."
        />
        <GitHubPreview />
      </div>
    </section>
  );
}

// ---------- For developers / For employers ----------

function Bullets({ items, tone }: { items: string[]; tone: "light" | "dark" }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((item) => (
        <li key={item} className={`flex gap-3 ${tone === "dark" ? "text-white/85" : "text-muted"}`}>
          <CheckIcon className={`mt-0.5 h-5 w-5 shrink-0 ${tone === "dark" ? "text-highlight" : "text-accent-text"}`} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function Audiences() {
  return (
    <section className="py-20 sm:py-24">
      <div className={`${container} grid grid-cols-1 gap-6 lg:grid-cols-2`}>
        {/* For developers */}
        <div id="candidates" className="flex scroll-mt-24 flex-col rounded-3xl bg-primary-soft p-6 sm:p-10">
          <p className="text-sm font-bold text-primary-text">For developers</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Let your projects do the talking</h2>
          <Bullets
            tone="light"
            items={[
              "A profile built from real code, not buzzwords",
              "Match scores with clear reasons for every job",
              "Tips on which skill to build next",
              "Every application tracked in one place",
            ]}
          />
          <MatchInsightMockup className="mt-10 sm:mt-auto sm:pt-10" />
        </div>

        {/* For employers */}
        <div id="employers" className="flex scroll-mt-24 flex-col rounded-3xl bg-panel p-6 text-white sm:p-10">
          <p className="text-sm font-bold text-highlight">For employers</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Hire on evidence, not keywords</h2>
          <Bullets
            tone="dark"
            items={[
              "Post a job with the skills you need",
              "Applicants ranked by verified skills",
              "Open the repositories behind any skill",
              "AI summaries to review faster. You decide.",
            ]}
          />
          <ApplicantsMockup className="mt-10 sm:mt-auto sm:pt-10" />
        </div>
      </div>
    </section>
  );
}

// ---------- Profile spotlight ----------

function ProfileSpotlight() {
  return (
    <section className="border-t border-border py-20 sm:py-24">
      <div className={`${container} grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20`}>
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-surface">
            <Image
              src="/images/people/amara-wide.jpg"
              alt="Amara Okafor, a frontend developer, smiling in an office"
              fill
              sizes="(min-width: 1024px) 40rem, 100vw"
              className="object-cover object-top"
            />
          </div>
          <SkillProfileMockup className="relative mx-3 -mt-24 sm:mx-0 sm:-mr-4 sm:ml-auto sm:max-w-sm lg:-mr-10" />
        </div>

        <div>
          <SectionHeading
            eyebrow="What employers see"
            title="A profile that backs up every claim"
            text="Instead of a list of keywords, employers see each skill with the repositories behind it. One click opens the code."
          />
          <dl className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              { term: "Verified skills", detail: "Detected from your own repositories" },
              { term: "Linked proof", detail: "Every skill opens the code behind it" },
              { term: "Clear matches", detail: "Scores explained in plain language" },
            ].map((item) => (
              <div key={item.term} className="border-l-2 border-highlight pl-4">
                <dt className="font-bold">{item.term}</dt>
                <dd className="mt-1 text-sm text-muted">{item.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

// ---------- FAQ ----------

const faqs = [
  {
    q: "Do I need a résumé?",
    a: "No. Sign in with GitHub and LaunchPad builds your skill profile from your public repositories.",
  },
  {
    q: "What does LaunchPad read from my GitHub account?",
    a: "Only your public profile and public repositories. That is where your skills are detected from.",
  },
  {
    q: "Does AI decide who gets hired?",
    a: "No. AI explains why a candidate matches a job and suggests ways to improve. Employers make every hiring decision.",
  },
  {
    q: "I'm hiring. How do I get started?",
    a: "Sign in with GitHub, choose the employer role, create your company profile, and post a job with the skills you need. Applicants are ranked by their verified skills.",
  },
  {
    q: "Who built LaunchPad?",
    a: "Francis, Maxwell, and Godwin, a student team at BYU-Pathway Worldwide, as our CSE 499 senior project.",
  },
];

function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 bg-surface py-20 sm:py-24">
      <div className={`${container} grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20`}>
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        {/* <details> gives an accessible, keyboard-friendly accordion with no JavaScript. */}
        <div className="divide-y divide-border border-y border-border">
          {faqs.map((faq) => (
            <details key={faq.q} className="group py-5">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-xl leading-none transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-muted">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Final call to action ----------

function FinalCta() {
  return (
    <section className="py-20 sm:py-24">
      <div className={container}>
        <div className="flex flex-col items-start gap-8 rounded-3xl bg-panel px-6 py-12 text-white sm:px-12 sm:py-16 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            {/* A row of overlapping profile photos */}
            <div className="flex -space-x-3">
              {(Object.keys(people) as PersonKey[]).map((key) => (
                <span key={key} className="relative h-11 w-11 overflow-hidden rounded-full ring-4 ring-panel">
                  <Image src={people[key].avatar} alt="" fill sizes="44px" className="object-cover" />
                </span>
              ))}
            </div>
            <h2 className="mt-6 text-[clamp(1.875rem,2.2vw+1rem,2.75rem)] leading-tight font-extrabold tracking-tight text-balance">
              Your next job is already in your repositories.
            </h2>
            <p className="mt-3 text-lg text-white/75">Connect GitHub and see your verified skill profile.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col xl:flex-row">
            <Suspense fallback={<PrimaryCtaSkeleton variant="light" />}>
              <PrimaryCta variant="light" />
            </Suspense>
            {/* Plain <a> so the hero's audience switch hears the "#for-employers" change. */}
            <a
              href="#for-employers"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3 font-semibold text-white transition hover:border-white"
            >
              I&apos;m hiring
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
