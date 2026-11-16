// The create/edit form for an employer's company profile (issue #12).
// It is a Client Component because it shows errors and a "Saving..." state
// without a full page reload. useActionState runs the server action and gives
// back its result (the form state) after each submit.
"use client";

import { useActionState, useState } from "react";
import { saveCompany, type CompanyFormState } from "@/app/employer/company/actions";
import { COMPANY_DESCRIPTION_MAX, COMPANY_NAME_MAX } from "@/lib/validation/company";

type Company = {
  name: string;
  website: string | null;
  description: string | null;
};

const initialState: CompanyFormState = { status: "idle" };

const inputClass =
  "mt-2 block w-full rounded-xl border bg-card px-4 py-3 text-base outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20";

export function CompanyForm({ company }: { company: Company | null }) {
  const [state, formAction, isPending] = useActionState(saveCompany, initialState);
  const errors = state.errors ?? {};

  // After a submit, show what was submitted; before that, show the saved company.
  const values = state.values ?? {
    name: company?.name ?? "",
    website: company?.website ?? "",
    description: company?.description ?? "",
  };

  // Highlights a field in red when it has an error.
  const borderFor = (field: keyof typeof errors) => (errors[field] ? "border-red-500" : "border-border");

  return (
    <form action={formAction} noValidate className="space-y-6">
      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            state.status === "success" ? "bg-accent-soft text-accent-text" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {state.message}
        </p>
      )}

      <div>
        <label htmlFor="name" className="text-sm font-semibold">
          Company name <span className="text-red-600">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={COMPANY_NAME_MAX}
          defaultValue={values.name}
          placeholder="Brightpath Labs"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={`${inputClass} ${borderFor("name")}`}
        />
        {errors.name && (
          <p id="name-error" className="mt-2 text-sm text-red-600">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="website" className="text-sm font-semibold">
          Website <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="website"
          name="website"
          type="url"
          inputMode="url"
          defaultValue={values.website}
          placeholder="https://example.com"
          aria-invalid={Boolean(errors.website)}
          aria-describedby={errors.website ? "website-error" : undefined}
          className={`${inputClass} ${borderFor("website")}`}
        />
        {errors.website && (
          <p id="website-error" className="mt-2 text-sm text-red-600">
            {errors.website}
          </p>
        )}
      </div>

      {/* The key resets the character counter whenever new values come back from the server. */}
      <DescriptionField
        key={values.description}
        defaultValue={values.description}
        error={errors.description}
        className={`${inputClass} ${borderFor("description")} resize-y`}
      />

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Saving..." : company ? "Save changes" : "Create company profile"}
      </button>
    </form>
  );
}

// The description textarea with a live character counter.
function DescriptionField({ defaultValue, error, className }: { defaultValue: string; error?: string; className: string }) {
  const [length, setLength] = useState(defaultValue.length);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor="description" className="text-sm font-semibold">
          About the company <span className="font-normal text-muted">(optional)</span>
        </label>
        <span className="text-xs text-muted">
          {length}/{COMPANY_DESCRIPTION_MAX}
        </span>
      </div>
      <textarea
        id="description"
        name="description"
        rows={6}
        maxLength={COMPANY_DESCRIPTION_MAX}
        defaultValue={defaultValue}
        onChange={(event) => setLength(event.target.value.length)}
        placeholder="What does your company build, and what is it like to work there?"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "description-error" : undefined}
        className={className}
      />
      {error && (
        <p id="description-error" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
