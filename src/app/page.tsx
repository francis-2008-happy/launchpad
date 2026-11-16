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

// Shared width and side padding for every section.
const container = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

export default function HomePage() {
  return (
    <main className="overflow-x-clip">
      <Hero />
      <HowItWorks />
      <Audiences />
      <ProfileSpotlight />
      <Faq />
      <FinalCta />
    </main>
  );
}

// ---------- Hero ----------

type PersonKey = keyof typeof people;

// A photo of a person with a small label on top, like a profile preview.
function PhotoTile({
  person,
  aspect,
  label,
  labelPosition = "bottom",
}: {
  person: PersonKey;
  aspect: string;
  label: React.ReactNode;
  labelPosition?: "top" | "bottom";
}) {
  const p = people[person];
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-surface ${aspect}`}>
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
      </span>
    </div>
  );
}

function Hero() {
  return (
    <section className={`${container} grid grid-cols-1 items-center gap-12 pt-10 pb-16 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-20 lg:pb-24`}>
      {/* Text */}
      <div className="motion-safe:animate-rise">
        <p className="inline-flex items-center gap-2 rounded-full bg-highlight-soft px-3 py-1 text-sm font-semibold text-foreground">
          <span className="h-2 w-2 rounded-full bg-highlight" />
          For junior and self-taught developers
        </p>

        <h1 className="mt-6 text-[clamp(2.4rem,4.2vw+1rem,4.25rem)] leading-[1.05] font-extrabold tracking-tight text-balance">
          Get hired for the code you&apos;ve{" "}
          <span className="relative isolate whitespace-nowrap">
            {/* A marker-style highlight behind the words */}
            <span aria-hidden="true" className="absolute inset-x-0 bottom-[0.08em] -z-10 h-[0.35em] rounded-sm bg-highlight/60" />
            already written.
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-pretty text-muted sm:text-xl">
          LaunchPad turns your GitHub into a verified skill profile. Employers see what you&apos;ve actually built, and
          you see exactly why you match each job.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Suspense fallback={<PrimaryCtaSkeleton />}>
            <PrimaryCta />
          </Suspense>
          <Link
            href="#employers"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-base font-semibold transition hover:border-primary hover:text-primary-text"
          >
            I&apos;m hiring
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <ul className="mt-8 grid gap-2 text-sm text-muted sm:flex sm:flex-wrap sm:gap-x-6">
          {["No résumé upload", "Every skill linked to real code", "AI explains, people decide"].map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <CheckIcon className="h-4 w-4 text-accent-text" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Photo collage: real people, each with a verified skill or match label. */}
      <div className="relative isolate motion-safe:animate-rise motion-safe:[animation-delay:120ms]">
        <div aria-hidden="true" className="absolute inset-y-8 -right-4 left-10 -z-10 rounded-[2rem] bg-primary-soft sm:-right-8" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="mt-10 space-y-3 sm:space-y-4">
            <PhotoTile
              person="arjun"
              aspect="aspect-[4/5]"
              label={
                <>
                  <CheckIcon className="h-3.5 w-3.5 text-accent-text" /> React · 6 repos
                </>
              }
            />
            <PhotoTile
              person="sofia"
              aspect="aspect-square"
              label={
                <>
                  <CheckIcon className="h-3.5 w-3.5 text-accent-text" /> PostgreSQL
                </>
              }
            />
          </div>
          <div className="space-y-3 sm:space-y-4">
            <PhotoTile
              person="maya"
              aspect="aspect-square"
              labelPosition="top"
              label={
                <>
                  <span className="h-2 w-2 rounded-full bg-accent" /> 92% match
                </>
              }
            />
            <PhotoTile
              person="daniel"
              aspect="aspect-[4/5]"
              label={
                <>
                  <CheckIcon className="h-3.5 w-3.5 text-accent-text" /> TypeScript · 4 repos
                </>
              }
            />
          </div>
        </div>
      </div>
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
            <Link
              href="#employers"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3 font-semibold text-white transition hover:border-white"
            >
              I&apos;m hiring
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
