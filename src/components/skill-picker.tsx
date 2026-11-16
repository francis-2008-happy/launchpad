// Search-and-pick list of required skills for a job (issue #14).
// Chosen skills show as removable chips. Each chip also renders a hidden
// <input name="skillIds">, which is how the chosen skills reach the server action.
"use client";

import { useState } from "react";

export type SkillOption = { id: string; name: string; category: string };

const MAX_SUGGESTIONS = 8;

export function SkillPicker({
  skills,
  initialSelected,
  max,
  error,
}: {
  skills: SkillOption[];
  initialSelected: string[];
  max: number;
  error?: string;
}) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [query, setQuery] = useState("");

  const chosen = selected
    .map((id) => skills.find((skill) => skill.id === id))
    .filter((skill): skill is SkillOption => Boolean(skill));

  // Skills that match what was typed and are not chosen yet.
  const search = query.trim().toLowerCase();
  const suggestions = search
    ? skills
        .filter((skill) => !selected.includes(skill.id) && skill.name.toLowerCase().includes(search))
        .slice(0, MAX_SUGGESTIONS)
    : [];
  const isFull = selected.length >= max;

  function add(id: string) {
    if (isFull) return;
    setSelected([...selected, id]);
    setQuery("");
  }

  function remove(id: string) {
    setSelected(selected.filter((skillId) => skillId !== id));
  }

  return (
    <fieldset aria-describedby={error ? "skills-help skills-error" : "skills-help"}>
      <legend className="text-sm font-semibold">
        Required skills <span className="text-red-600">*</span>
      </legend>
      <p id="skills-help" className="mt-1 text-sm text-muted">
        Candidates are matched on these skills. Choose up to {max}. ({selected.length}/{max} chosen)
      </p>

      {chosen.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Chosen skills">
          {chosen.map((skill) => (
            <li key={skill.id}>
              <input type="hidden" name="skillIds" value={skill.id} />
              <span className="inline-flex min-h-9 items-center gap-1 rounded-full bg-primary-soft py-1 pl-3 pr-1 text-sm font-semibold text-primary-text">
                {skill.name}
                <button
                  type="button"
                  onClick={() => remove(skill.id)}
                  aria-label={`Remove ${skill.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-base leading-none hover:bg-accent-soft"
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <label htmlFor="skill-search" className="sr-only">
        Search skills
      </label>
      <input
        id="skill-search"
        type="search"
        autoComplete="off"
        value={query}
        disabled={isFull}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          // Enter adds the first suggestion instead of submitting the whole form.
          if (event.key === "Enter") {
            event.preventDefault();
            if (suggestions[0]) add(suggestions[0].id);
          }
        }}
        placeholder={isFull ? `You have chosen ${max} skills` : "Search skills, for example React"}
        aria-invalid={Boolean(error)}
        className={`mt-3 block w-full rounded-xl border bg-card px-4 py-3 text-base outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 ${
          error ? "border-red-500" : "border-border"
        }`}
      />

      {search && (
        <ul aria-label="Matching skills" className="mt-2 flex flex-wrap gap-2">
          {suggestions.length === 0 ? (
            <li className="text-sm text-muted">No skills match &ldquo;{query.trim()}&rdquo;.</li>
          ) : (
            suggestions.map((skill) => (
              <li key={skill.id}>
                <button
                  type="button"
                  onClick={() => add(skill.id)}
                  className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border px-3 py-1 text-sm font-medium transition hover:border-primary hover:text-primary-text"
                >
                  + {skill.name}
                  <span className="text-xs text-muted">{skill.category}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {error && (
        <p id="skills-error" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
