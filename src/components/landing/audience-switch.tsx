// The "Developer / Employer" switch at the top of the landing page (issue #29).
// It swaps the hero's headline, text, buttons, and pictures between the two
// audiences. Both versions are built on the server and passed in, so this
// component only decides which one to show.
//
// "I'm hiring" links point to #for-employers. When the address ends with that,
// the employer version is shown, so the links work from anywhere on the page.
"use client";

import { useEffect, useState } from "react";

type Audience = "developer" | "employer";

const EMPLOYER_HASH = "#for-employers";

export function AudienceSwitch({ developer, employer }: { developer: React.ReactNode; employer: React.ReactNode }) {
  const [audience, setAudience] = useState<Audience>("developer");

  // Follow the address: "#for-employers" shows the employer version.
  useEffect(() => {
    function syncWithHash() {
      if (window.location.hash === EMPLOYER_HASH) setAudience("employer");
    }
    syncWithHash();
    window.addEventListener("hashchange", syncWithHash);
    return () => window.removeEventListener("hashchange", syncWithHash);
  }, []);

  function choose(next: Audience) {
    setAudience(next);
    // Keep the address in step, without jumping the page, so the view can be shared.
    const url = next === "employer" ? EMPLOYER_HASH : window.location.pathname + window.location.search;
    window.history.replaceState(null, "", url);
  }

  const options: { value: Audience; label: string }[] = [
    { value: "developer", label: "I'm a developer" },
    { value: "employer", label: "I'm hiring" },
  ];

  return (
    <>
      {/* Two toggle buttons. aria-pressed tells screen readers which one is on;
          they work with Tab and Enter/Space like any button. */}
      <div role="group" aria-label="Show LaunchPad for" className="inline-flex rounded-full border border-border bg-surface p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={audience === option.value}
            onClick={() => choose(option.value)}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${
              audience === option.value ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* The key restarts the entrance animation each time the audience changes.
          aria-live announces the new headline to screen reader users. */}
      <div key={audience} aria-live="polite" className="motion-safe:animate-rise">
        {audience === "developer" ? developer : employer}
      </div>
    </>
  );
}
