// Validation for the "post a job" form (issue #14).
// A pure function: it takes the raw form values and returns either clean data
// ready to save, or an error message for each invalid field. It runs on the
// server inside the server action, so it cannot be skipped from the browser.
//
// It checks the shape of the skill ids. The server action also checks that each
// id is a real skill in the database.

export type JobInput = {
  title: string;
  description: string;
  location: string;
  isRemote: boolean;
  skillIds: string[];
};

export type JobData = {
  title: string;
  description: string;
  location: string | null;
  is_remote: boolean;
  skillIds: string[];
};

export type JobErrors = Partial<Record<"title" | "description" | "location" | "skillIds", string>>;

export type JobValidation = { ok: true; data: JobData } | { ok: false; errors: JobErrors };

export const JOB_TITLE_MAX = 150; // matches the check constraint in the database
export const JOB_DESCRIPTION_MAX = 5000;
export const JOB_LOCATION_MAX = 120;
export const JOB_SKILLS_MAX = 10;

// Database ids are UUIDs, for example 3f2b9c1e-8d4a-4b6f-9e2a-1c7d5e8f0a3b.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateJob(input: JobInput): JobValidation {
  const errors: JobErrors = {};

  const title = input.title.trim();
  if (title.length === 0) {
    errors.title = "Enter a job title.";
  } else if (title.length > JOB_TITLE_MAX) {
    errors.title = `Job title must be ${JOB_TITLE_MAX} characters or fewer.`;
  }

  const description = input.description.trim();
  if (description.length === 0) {
    errors.description = "Describe the job so candidates know what they would work on.";
  } else if (description.length > JOB_DESCRIPTION_MAX) {
    errors.description = `Description must be ${JOB_DESCRIPTION_MAX} characters or fewer.`;
  }

  const location = input.location.trim();
  if (location.length > JOB_LOCATION_MAX) {
    errors.location = `Location must be ${JOB_LOCATION_MAX} characters or fewer.`;
  } else if (location.length === 0 && !input.isRemote) {
    errors.location = "Enter a location, or mark the job as remote.";
  }

  // Remove duplicates, so picking the same skill twice cannot break the save.
  const skillIds = [...new Set(input.skillIds.map((id) => id.trim()).filter(Boolean))];
  if (skillIds.length === 0) {
    errors.skillIds = "Add at least one required skill.";
  } else if (skillIds.length > JOB_SKILLS_MAX) {
    errors.skillIds = `Choose ${JOB_SKILLS_MAX} skills or fewer.`;
  } else if (!skillIds.every((id) => UUID_PATTERN.test(id))) {
    errors.skillIds = "One of the skills is not valid. Please choose skills from the list.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      title,
      description,
      location: location || null,
      is_remote: input.isRemote,
      skillIds,
    },
  };
}
