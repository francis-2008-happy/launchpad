// Home page: a simple placeholder until sign in (#6) and the dashboards are built.
// This is a Server Component (no "use client"), because it has no state or browser code.
export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">LaunchPad</h1>

        <p className="mt-4 text-lg text-foreground/70 sm:text-xl">
          Proof-of-skill hiring. Show employers what you can build with a profile
          verified from your real GitHub code.
        </p>

        {/* Placeholder button. GitHub sign in is wired up in issue #6. */}
        <button
          type="button"
          disabled
          className="mt-8 w-full rounded-lg bg-foreground px-6 py-3 font-medium text-background opacity-60 sm:w-auto"
        >
          Sign in with GitHub (coming soon)
        </button>
      </div>
    </main>
  );
}
