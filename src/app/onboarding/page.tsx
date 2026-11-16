// src/app/onboarding/page.tsx
// New users choose their role here (issue #8). Redesigned in issue #56: only the
// look changed. The form still sends a "role" radio value of "candidate" or
// "employer" to the same completeOnboarding server action.
//
// Each role card is a <label> around a hidden native radio button, so it works
// with a mouse, a keyboard (Tab, then arrow keys), and screen readers.
import type { Metadata } from "next";
import { completeOnboarding } from "@/app/actions/onboarding";
import { BriefcaseIcon, CheckIcon, CodeIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Choose your role | LaunchPad",
};

const roles = [
  {
    value: "candidate",
    title: "I'm a developer",
    description: "Looking for a job or internship",
    Icon: CodeIcon,
    points: [
      "Build a verified skill profile from GitHub",
      "See your match score for every job",
      "Apply and track your applications",
    ],
  },
  {
    value: "employer",
    title: "I'm hiring",
    description: "Hiring developers for my company",
    Icon: BriefcaseIcon,
    points: [
      "Create your company profile",
      "Post jobs with the skills you need",
      "Review applicants ranked by proven skills",
    ],
  },
];

const steps = ["Sign in", "Choose your role", "Your dashboard"];

export default function OnboardingPage() {
  return (
    <main className="flex flex-1 justify-center bg-surface px-4 py-10 sm:px-6 sm:py-16">
      <div className="w-full max-w-3xl">
        {/* Progress: step 2 of 3 */}
        <ol aria-label="Sign up progress" className="flex items-center justify-center gap-2 text-xs font-semibold sm:gap-3 sm:text-sm">
          {steps.map((step, index) => {
            const done = index === 0;
            const current = index === 1;
            return (
              <li key={step} aria-current={current ? "step" : undefined} className="flex items-center gap-2 sm:gap-3">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    done || current ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted"
                  }`}
                >
                  {done ? <CheckIcon className="h-4 w-4" /> : index + 1}
                </span>
                <span className={current ? "text-foreground" : "text-muted"}>{step}</span>
                {index < steps.length - 1 && <span aria-hidden="true" className="h-px w-5 bg-border sm:w-10" />}
              </li>
            );
          })}
        </ol>

        <div className="mt-10 text-center">
          <h1 className="text-[clamp(1.9rem,2.4vw+1rem,2.75rem)] leading-tight font-extrabold tracking-tight">
            Welcome to LaunchPad
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-muted">How will you use LaunchPad? Choose one to get started.</p>
        </div>

        <form action={completeOnboarding} className="mt-10">
          <fieldset>
            <legend className="sr-only">I am</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              {roles.map(({ value, title, description, Icon, points }) => (
                <label
                  key={value}
                  // has-checked: styles the card when its radio is selected.
                  // has-focus-visible: shows a focus ring when keyboard users reach it.
                  className="group relative flex cursor-pointer flex-col rounded-3xl border-2 border-border bg-card p-6 transition hover:border-primary/50 has-checked:border-primary has-checked:shadow-[0_18px_40px_-20px_rgba(4,120,87,0.55)] has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-primary-text sm:p-8"
                >
                  <input type="radio" name="role" value={value} required className="sr-only" />

                  {/* The check in the corner appears when this card is chosen. */}
                  <span
                    aria-hidden="true"
                    className="absolute top-5 right-5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-border text-transparent transition group-has-checked:border-primary group-has-checked:bg-primary group-has-checked:text-primary-foreground"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </span>

                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-text">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="mt-5 text-xl font-bold">{title}</span>
                  <span className="mt-1 text-muted">{description}</span>
                  <ul className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
                    {points.map((point) => (
                      <li key={point} className="flex gap-2">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition hover:bg-primary-hover sm:w-auto"
            >
              Continue to dashboard
            </button>
            <p className="text-center text-sm text-muted">
              You can&apos;t change your role later. Need both? Use a separate GitHub account for each.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
