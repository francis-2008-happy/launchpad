// Upload or remove the company logo (issue #13).
// A Client Component so it can show a preview of the chosen image before it is
// uploaded, and a "Uploading..." state while the server action runs.
"use client";

import { useActionState, useEffect, useState } from "react";
import { removeLogo, uploadLogo, type LogoFormState } from "@/app/employer/company/logo-actions";
import { CompanyLogo } from "@/components/company-logo";
import { LOGO_MAX_BYTES } from "@/lib/validation/company";

const initialState: LogoFormState = { status: "idle" };

export function CompanyLogoForm({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const [state, formAction, isPending] = useActionState(uploadLogo, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const [tooLarge, setTooLarge] = useState(false);

  // When an upload finishes, React clears the file input, so clear the preview
  // too. The saved logo (or the error message) is shown instead.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    setPreview(null);
  }

  // Free the preview's temporary URL when it changes or the form goes away.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // A quick check in the browser for a friendlier message. The server checks again.
    setTooLarge(Boolean(file && file.size > LOGO_MAX_BYTES));
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  const message = tooLarge ? "The logo must be 2 MB or smaller." : state.message;
  const isError = tooLarge || state.status === "error";

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
      {preview ? (
        // A plain <img> because the preview is a temporary local file, not a stored image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Preview of the new logo"
          className="h-24 w-24 shrink-0 rounded-xl border border-border bg-white object-contain p-1"
        />
      ) : (
        <CompanyLogo name={name} logoUrl={logoUrl} size={96} />
      )}

      <div className="min-w-0 flex-1 space-y-3">
        <form action={formAction} className="space-y-3">
          <label htmlFor="logo" className="text-sm font-semibold">
            Company logo
          </label>
          <p id="logo-help" className="text-sm text-muted">
            PNG, JPEG, or WebP, up to 2 MB. A square image looks best.
          </p>
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
            onChange={handleFileChange}
            aria-describedby={message ? "logo-help logo-message" : "logo-help"}
            aria-invalid={isError}
            className="block w-full text-sm text-muted file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-xl file:border-0 file:bg-primary-soft file:px-4 file:font-semibold file:text-primary-text hover:file:bg-accent-soft"
          />

          {message && (
            <p
              id="logo-message"
              role={isError ? "alert" : "status"}
              className={`text-sm font-medium ${isError ? "text-red-600" : "text-accent-text"}`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || tooLarge || !preview}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isPending ? "Uploading..." : "Upload logo"}
          </button>
        </form>

        {logoUrl && !preview && (
          <form action={removeLogo}>
            <button type="submit" className="min-h-11 text-sm font-semibold text-red-600 hover:underline">
              Remove logo
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
