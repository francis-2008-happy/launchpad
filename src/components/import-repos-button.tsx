// The "Import my repositories" / "Refresh" button (issue #39).
// A Client Component so it can show "Importing..." while the server action
// talks to GitHub, and the result message afterwards.
"use client";

import { useActionState } from "react";
import { importRepositories, type ImportState } from "@/app/candidate/actions";
import { GitHubIcon } from "@/components/icons";

const initialState: ImportState = { status: "idle" };

export function ImportReposButton({ hasImported, variant = "primary" }: { hasImported: boolean; variant?: "primary" | "secondary" }) {
  const [state, formAction, isPending] = useActionState(importRepositories, initialState);

  const style =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary-hover"
      : "border border-border bg-card hover:border-primary hover:text-primary-text";

  return (
    <form action={formAction} className="space-y-3">
      <button
        type="submit"
        disabled={isPending}
        className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-70 sm:w-auto ${style}`}
      >
        <GitHubIcon className="h-4 w-4" />
        {isPending ? "Importing from GitHub..." : hasImported ? "Refresh from GitHub" : "Import my repositories"}
      </button>
      {isPending && <p className="text-sm text-muted">This can take up to a minute for many repositories.</p>}
      {!isPending && state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`text-sm font-medium ${state.status === "error" ? "text-red-600" : "text-accent-text"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
