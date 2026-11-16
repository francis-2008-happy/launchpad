"use client";
// Client Component: it needs a click handler and the browser's address (window.location).
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GitHubIcon } from "@/components/icons";

export function GitHubSignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    // Sends the user to GitHub. After they approve, GitHub returns them to /auth/callback.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError("Could not start GitHub sign in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={loading}
        className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70"
      >
        <GitHubIcon className="h-5 w-5" />
        {loading ? "Redirecting to GitHub..." : "Continue with GitHub"}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
