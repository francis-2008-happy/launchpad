// Sign in page. The (auth) folder is a "route group": it organizes files
// without adding "/auth" to the URL, so this page lives at /sign-in.
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GitHubSignInButton } from "@/components/github-sign-in-button";

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
    <p role="alert" className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
      Sign in did not complete. Please try again.
    </p>
  );
}

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-sm rounded-2xl border border-foreground/10 p-6 shadow-sm sm:p-8">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          LaunchPad
        </Link>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-2 mb-6 text-sm text-foreground/70">
          Use your GitHub account. New here? Signing in creates your account.
        </p>

        <Suspense fallback={null}>
          <SignInError searchParams={searchParams} />
        </Suspense>

        <GitHubSignInButton />

        <p className="mt-6 text-xs text-foreground/60">
          We only read your public profile and repositories to build your skill profile.
        </p>
      </div>
    </main>
  );
}
