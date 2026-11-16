// src/app/page.tsx
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";


// Helper to safely check login status on the home page
async function HomeAuthButton() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return (
      <Link href="/candidate/dashboard" className="mt-8 inline-block w-full rounded-lg bg-foreground px-6 py-3 font-medium text-background transition hover:opacity-90 sm:w-auto">
        Go to Dashboard
      </Link>
    );
  }

  return (
    <Link href="/sign-in" className="mt-8 inline-block w-full rounded-lg bg-foreground px-6 py-3 font-medium text-background transition hover:opacity-90 sm:w-auto">
      Sign in with GitHub
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">LaunchPad</h1>
        <p className="mt-4 text-lg text-foreground/70 sm:text-xl">
          Proof-of-skill hiring. Show employers what you can build with a profile verified from your real GitHub code.
        </p>

        <Suspense fallback={<button disabled className="mt-8 w-full rounded-lg bg-foreground/50 px-6 py-3 font-medium text-background opacity-60 sm:w-auto animate-pulse">Loading...</button>}>
          <HomeAuthButton />
        </Suspense>
      </div>
    </main>
  );
}