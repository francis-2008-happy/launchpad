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

// ---------- Company logo (issue #13) ----------

export const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB, the same limit as the storage bucket

export type LogoType = { mimeType: "image/png" | "image/jpeg" | "image/webp"; extension: "png" | "jpg" | "webp" };

// Works out the real image type from the first bytes of the file (its "magic
// number"). The type the browser reports is just a label the user's computer
// chose, so a renamed file could lie about it. These bytes cannot.
export function detectLogoType(bytes: Uint8Array): LogoType | null {
  const startsWith = (signature: number[], offset = 0) =>
    signature.every((byte, i) => bytes[offset + i] === byte);

  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mimeType: "image/png", extension: "png" };
  }
  if (startsWith([0xff, 0xd8, 0xff])) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }
  // WebP files start with "RIFF", four size bytes, then "WEBP".
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) {
    return { mimeType: "image/webp", extension: "webp" };
  }
  return null;
}

export type LogoValidation = { ok: true; type: LogoType } | { ok: false; error: string };

// Checks an uploaded logo: it must exist, be 2 MB or smaller, and really be a PNG, JPEG, or WebP image.
export function validateLogo(size: number, firstBytes: Uint8Array): LogoValidation {
  if (size === 0) {
    return { ok: false, error: "Choose an image to upload." };
  }
  if (size > LOGO_MAX_BYTES) {
    return { ok: false, error: "The logo must be 2 MB or smaller." };
  }
  const type = detectLogoType(firstBytes);
  if (!type) {
    return { ok: false, error: "The logo must be a PNG, JPEG, or WebP image." };
  }
  return { ok: true, type };
}
