// Sign in page. The (auth) folder is a "route group": it organizes files
// without adding "/auth" to the URL, so this page lives at /sign-in.
//
// Layout (issue #56): on desktop, a dark green brand panel on the left and the
// sign-in card on the right. On phones the panel becomes a short strip above
// the card, so the GitHub button is still near the top of the screen.
import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { GitHubSignInButton } from "@/components/github-sign-in-button";
import { CheckIcon, ShieldIcon } from "@/components/icons";
import { people } from "@/components/landing/product-mockups";

export const metadata: Metadata = {
  title: "Sign in | LaunchPad",
};

// Shows a message if the auth callback sent the user back with ?error=auth.
// searchParams is only known when a request comes in, so this part is wrapped in
// <Suspense> below and the rest of the page can still be pre-rendered.
async function SignInError({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!error) return null;
  return (
    <p role="alert" className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
      Sign in did not complete. Please try again.
    </p>
  );
}

const benefits = [
  "A skill profile built from your real code",
  "Every skill linked to the repositories that prove it",
  "Clear match scores for every job",
];

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="grid flex-1 grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />

      {/* Sign-in card */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_24px_48px_-24px_rgba(15,31,26,0.25)] sm:p-10">
            <p className="text-sm font-bold text-primary-text">Welcome to LaunchPad</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Sign in</h1>
            <p className="mt-3 text-muted">
              Use your GitHub account. New here? Signing in creates your account, then you choose whether you&apos;re
              a developer or hiring.
            </p>

            <div className="mt-8">
              <Suspense fallback={null}>
                <SignInError searchParams={searchParams} />
              </Suspense>
              <GitHubSignInButton />
            </div>

            {/* What we read, so people feel safe connecting GitHub. */}
            <div className="mt-8 flex gap-3 rounded-2xl bg-surface p-4">
              <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary-text" />
              <div className="text-sm">
                <p className="font-semibold">We only read public data</p>
                <p className="mt-1 text-muted">
                  Your public profile and public repositories. LaunchPad never posts, pushes code, or reads private
                  repositories.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            Hiring? Employers sign in with GitHub too, then choose <span className="font-semibold text-foreground">I&apos;m hiring</span>.
          </p>
        </div>
      </section>
    </main>
  );
}

// The dark green panel with a photo and a sample verified profile.
function BrandPanel() {
  const amara = people.amara;
  return (
    <section
      aria-label="Why LaunchPad"
      className="relative overflow-hidden bg-panel px-4 py-8 text-white sm:px-10 lg:flex lg:flex-col lg:justify-center lg:px-14 lg:py-16"
    >
      <div className="relative mx-auto w-full max-w-xl">
        <h2 className="text-[clamp(1.6rem,2.4vw+1rem,2.75rem)] leading-tight font-extrabold tracking-tight text-balance">
          Your code is your <span className="text-highlight">résumé</span>.
        </h2>
        <ul className="mt-6 hidden space-y-3 sm:block">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex gap-3 text-white/85">
              <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-highlight" />
              {benefit}
            </li>
          ))}
        </ul>

        {/* Photo with a sample verified profile card. Shown from tablet size up. */}
        <figure className="relative mt-10 hidden sm:block">
          <figcaption className="sr-only">
            Example: Amara Okafor&apos;s profile shows TypeScript, React, and PostgreSQL verified from her repositories.
          </figcaption>
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl">
            <Image
              src="/images/people/amara-wide.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 36rem, 90vw"
              preload
              className="object-cover object-top"
            />
          </div>
          <div
            aria-hidden="true"
            className="absolute -bottom-6 left-4 right-4 rounded-2xl bg-card p-4 text-foreground shadow-[0_18px_40px_-16px_rgba(0,0,0,0.5)] sm:left-auto sm:w-80"
          >
            <div className="flex items-center gap-3">
              <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-full">
                <Image src={amara.avatar} alt="" fill sizes="40px" className="object-cover" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{amara.name}</p>
                <p className="truncate text-xs text-muted">Frontend developer · 12 repos</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["TypeScript", "React", "PostgreSQL"].map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-text"
                >
                  <CheckIcon className="h-3 w-3" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}
