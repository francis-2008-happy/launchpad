"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent } from "react";

type Skill = {
  id: string;
  name: string;
};

type JobSearchFormProps = {
  skills: Skill[];
};

export function JobSearchForm({ skills }: JobSearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    const keyword = String(formData.get("q") ?? "").trim();
    const skill = String(formData.get("skill") ?? "");
    const location = String(formData.get("location") ?? "").trim();
    const remote = String(formData.get("remote") ?? "");

    if (keyword) {
      params.set("q", keyword);
    }

    if (skill) {
      params.set("skill", skill);
    }

    if (location) {
      params.set("location", location);
    }

    if (remote) {
      params.set("remote", remote);
    }

    const query = params.toString();

    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function handleClear() {
    router.push(pathname);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end">
        {/* Keyword search */}
        <div>
          <label htmlFor="q" className="text-sm font-semibold">
            Search jobs
          </label>

          <input
            id="q"
            name="q"
            type="search"
            defaultValue={searchParams.get("q") ?? ""}
            placeholder="Job title or keyword"
            className="mt-2 block w-full rounded-xl border border-border bg-card px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Skill filter */}
        <div>
          <label htmlFor="skill" className="text-sm font-semibold">
            Skill
          </label>

          <select
            id="skill"
            name="skill"
            defaultValue={searchParams.get("skill") ?? ""}
            className="mt-2 block w-full rounded-xl border border-border bg-card px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All skills</option>

            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
        </div>

        {/* Location filter */}
        <div>
          <label htmlFor="location" className="text-sm font-semibold">
            Location
          </label>

          <input
            id="location"
            name="location"
            type="text"
            defaultValue={searchParams.get("location") ?? ""}
            placeholder="Lagos, Nigeria"
            className="mt-2 block w-full rounded-xl border border-border bg-card px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Remote filter */}
        <div>
          <label htmlFor="remote" className="text-sm font-semibold">
            Work type
          </label>

          <select
            id="remote"
            name="remote"
            defaultValue={searchParams.get("remote") ?? ""}
            className="mt-2 block w-full rounded-xl border border-border bg-card px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All jobs</option>
            <option value="true">Remote</option>
            <option value="false">On-site</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="min-h-12 flex-1 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover lg:flex-none"
          >
            Search
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="min-h-12 rounded-xl border border-border px-4 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary-text"
          >
            Clear
          </button>
        </div>
      </div>
    </form>
  );
}