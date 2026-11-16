// The "post a job" form (issue #14).
// A Client Component so it can show field errors and a "Posting..." state
// without a full page reload. useActionState runs the server action and gives
// back its result after each submit.
"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createJob, type JobFormState } from "@/app/employer/jobs/new/actions";
import { SkillPicker, type SkillOption } from "@/components/skill-picker";
import { JOB_DESCRIPTION_MAX, JOB_LOCATION_MAX, JOB_SKILLS_MAX, JOB_TITLE_MAX } from "@/lib/validation/job";

const initialState: JobFormState = { status: "idle" };

const inputClass =
  "mt-2 block w-full rounded-xl border bg-card px-4 py-3 text-base outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20";

const emptyValues = { title: "", description: "", location: "", isRemote: false, skillIds: [] as string[] };

export function JobForm({ skills }: { skills: SkillOption[] }) {
  const [state, formAction, isPending] = useActionState(createJob, initialState);
  const errors = state.errors ?? {};
  // After a failed submit, keep what was typed. After success, start fresh.
  const values = state.values ?? emptyValues;
  const borderFor = (field: keyof typeof errors) => (errors[field] ? "border-red-500" : "border-border");

  return (
    // The key gives the form a fresh start after each submit, so every field
    // (including the skill picker) shows `values`.
    <form key={JSON.stringify(state)} action={formAction} noValidate className="space-y-6">
      {state.message && (
        <div
          role={state.status === "error" ? "alert" : "status"}
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            state.status === "success" ? "bg-accent-soft text-accent-text" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {state.message}
          {state.status === "success" && (
            <Link href="/employer/dashboard" className="ml-2 font-semibold underline">
              Back to dashboard
            </Link>
          )}
        </div>
      )}

      <div>
        <label htmlFor="title" className="text-sm font-semibold">
          Job title <span className="text-red-600">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={JOB_TITLE_MAX}
          defaultValue={values.title}
          placeholder="Frontend Engineer"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "title-error" : undefined}
          className={`${inputClass} ${borderFor("title")}`}
        />
        {errors.title && (
          <p id="title-error" className="mt-2 text-sm text-red-600">
            {errors.title}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="text-sm font-semibold">
          Description <span className="text-red-600">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={8}
          required
          maxLength={JOB_DESCRIPTION_MAX}
          defaultValue={values.description}
          placeholder="What will this person build? Who will they work with? What does a good first month look like?"
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "description-error" : undefined}
          className={`${inputClass} ${borderFor("description")} resize-y`}
        />
        {errors.description && (
          <p id="description-error" className="mt-2 text-sm text-red-600">
            {errors.description}
          </p>
        )}
      </div>

      <SkillPicker skills={skills} initialSelected={values.skillIds} max={JOB_SKILLS_MAX} error={errors.skillIds} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:items-start">
        <div>
          <label htmlFor="location" className="text-sm font-semibold">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            maxLength={JOB_LOCATION_MAX}
            defaultValue={values.location}
            placeholder="Lagos, Nigeria"
            aria-invalid={Boolean(errors.location)}
            aria-describedby={errors.location ? "location-error" : undefined}
            className={`${inputClass} ${borderFor("location")}`}
          />
          {errors.location && (
            <p id="location-error" className="mt-2 text-sm text-red-600">
              {errors.location}
            </p>
          )}
        </div>

        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3 sm:mt-7">
          <input name="isRemote" type="checkbox" defaultChecked={values.isRemote} className="h-5 w-5 accent-[var(--primary)]" />
          <span>
            <span className="block text-sm font-semibold">Remote job</span>
            <span className="block text-xs text-muted">Candidates can work from anywhere</span>
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Posting..." : "Post job"}
      </button>
    </form>
  );
}
