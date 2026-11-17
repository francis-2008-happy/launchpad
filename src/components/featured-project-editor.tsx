// One repository in the "Choose your featured projects" list (issue #42).
// Shows a Feature button, or for featured ones an Edit and a Remove button, and
// opens a small form for the project description.
"use client";

import { useActionState, useState } from "react";
import { removeFeaturedProject, saveFeaturedProject, type FeaturedFormState } from "@/app/candidate/featured-actions";
import { RepoIcon } from "@/components/icons";
import { PendingButton } from "@/components/pending-button";
import { FEATURED_DESCRIPTION_MAX } from "@/lib/validation/featured";

export type ManagedRepo = {
  id: string;
  name: string;
  url: string;
  primaryLanguage: string | null;
  isFeatured: boolean;
  featuredDescription: string | null;
};

const initialState: FeaturedFormState = { status: "idle" };

export function FeaturedProjectEditor({ repo, canFeatureMore }: { repo: ManagedRepo; canFeatureMore: boolean }) {
  const [state, formAction, isPending] = useActionState(saveFeaturedProject.bind(null, repo.id), initialState);
  const [editing, setEditing] = useState(false);
  const [length, setLength] = useState(repo.featuredDescription?.length ?? 0);

  // Close the form after a successful save.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state.status === "success") setEditing(false);
  }

  const formId = `featured-${repo.id}`;

  return (
    <li className="py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <a href={repo.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-mono text-sm font-semibold hover:underline">
            <RepoIcon className="h-4 w-4 shrink-0 text-muted" />
            <span className="truncate">{repo.name}</span>
          </a>
          <p className="mt-0.5 text-xs text-muted">
            {repo.isFeatured ? <span className="font-semibold text-accent-text">Featured</span> : null}
            {repo.isFeatured && repo.primaryLanguage ? " · " : null}
            {repo.primaryLanguage}
          </p>
        </div>

        {!editing && (
          <div className="flex shrink-0 gap-2">
            {repo.isFeatured ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold transition hover:border-primary sm:flex-none"
                >
                  Edit
                </button>
                <form action={removeFeaturedProject.bind(null, repo.id)} className="flex flex-1 sm:flex-none">
                  <PendingButton
                    pendingText="Removing..."
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-red-600 transition hover:border-red-500"
                  >
                    Remove
                  </PendingButton>
                </form>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={!canFeatureMore}
                title={canFeatureMore ? undefined : "You can feature up to 3 projects"}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold transition hover:border-primary hover:text-primary-text disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Feature
              </button>
            )}
          </div>
        )}
      </div>

      {editing && (
        <form id={formId} action={formAction} noValidate className="mt-3 space-y-3 rounded-xl bg-surface p-4">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={`${formId}-description`} className="text-sm font-semibold">
              What did you build, and what did you learn?
            </label>
            <span className="shrink-0 text-xs text-muted">
              {length}/{FEATURED_DESCRIPTION_MAX}
            </span>
          </div>
          <textarea
            id={`${formId}-description`}
            name="description"
            rows={3}
            maxLength={FEATURED_DESCRIPTION_MAX}
            defaultValue={state.description ?? repo.featuredDescription ?? ""}
            onChange={(event) => setLength(event.target.value.length)}
            placeholder="A booking app for small salons. I built the API with Next.js and Supabase and added tests with Jest."
            aria-invalid={state.status === "error"}
            aria-describedby={state.status === "error" ? `${formId}-error` : undefined}
            className="block w-full resize-y rounded-xl border border-border bg-card px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {state.status === "error" && (
            <p id={`${formId}-error`} role="alert" className="text-sm text-red-600">
              {state.message}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
            >
              {isPending ? "Saving..." : repo.isFeatured ? "Save description" : "Feature this project"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
