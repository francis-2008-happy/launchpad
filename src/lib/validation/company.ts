// Validation for the company profile form (issue #12).
// This is a pure function: it takes the raw form values and returns either
// clean data ready to save, or an error message for each invalid field.
// It runs on the server (inside the server action), so it cannot be skipped
// by editing the page in the browser.

export type CompanyInput = {
  name: string;
  website: string;
  description: string;
};

export type CompanyData = {
  name: string;
  website: string | null;
  description: string | null;
};

export type CompanyErrors = Partial<Record<keyof CompanyInput, string>>;

export type CompanyValidation =
  | { ok: true; data: CompanyData }
  | { ok: false; errors: CompanyErrors };

export const COMPANY_NAME_MAX = 120; // matches the check constraint in the database
export const COMPANY_DESCRIPTION_MAX = 2000;

export function validateCompany(input: CompanyInput): CompanyValidation {
  const errors: CompanyErrors = {};

  const name = input.name.trim();
  if (name.length === 0) {
    errors.name = "Enter your company name.";
  } else if (name.length > COMPANY_NAME_MAX) {
    errors.name = `Company name must be ${COMPANY_NAME_MAX} characters or fewer.`;
  }

  // The website is optional. If given, it must be a full http(s) link.
  const website = input.website.trim();
  if (website.length > 0 && !isHttpUrl(website)) {
    errors.website = "Enter a full link that starts with https://, for example https://example.com.";
  }

  const description = input.description.trim();
  if (description.length > COMPANY_DESCRIPTION_MAX) {
    errors.description = `Description must be ${COMPANY_DESCRIPTION_MAX} characters or fewer.`;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      name,
      website: website || null,
      description: description || null,
    },
  };
}

// True for links like "https://example.com". Rejects "javascript:" and other schemes.
function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}
