// src/app/onboarding/page.tsx
import { completeOnboarding } from "@/app/actions/onboarding";

export default function OnboardingPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to LaunchPad</h1>
        <p className="mt-4 text-lg text-foreground/70">
          To get started, please tell us how you will be using the platform.
        </p>

        <form action={completeOnboarding} className="mt-8 space-y-4 text-left">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground/80">
              I am a...
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="cursor-pointer">
                <input type="radio" name="role" value="candidate" className="peer sr-only" required />
                <div className="rounded-lg border border-foreground/20 bg-background p-4 text-center transition-all peer-checked:border-foreground peer-checked:bg-foreground/5 peer-checked:ring-1 peer-checked:ring-foreground">
                  <div className="text-lg font-semibold">Candidate</div>
                  <div className="mt-1 text-xs text-foreground/60">Looking for a job</div>
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="role" value="employer" className="peer sr-only" required />
                <div className="rounded-lg border border-foreground/20 bg-background p-4 text-center transition-all peer-checked:border-foreground peer-checked:bg-foreground/5 peer-checked:ring-1 peer-checked:ring-foreground">
                  <div className="text-lg font-semibold">Employer</div>
                  <div className="mt-1 text-xs text-foreground/60">Hiring developers</div>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-foreground px-6 py-3 font-medium text-background transition-opacity hover:opacity-90"
          >
            Continue to Dashboard
          </button>
        </form>
      </div>
    </main>
  );
}
