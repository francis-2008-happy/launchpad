// Unit tests for the company profile and logo validation (issues #12 and #13).
import {
  COMPANY_DESCRIPTION_MAX,
  COMPANY_NAME_MAX,
  LOGO_MAX_BYTES,
  detectLogoType,
  validateCompany,
  validateLogo,
} from "@/lib/validation/company";

const validCompany = { name: "Brightpath Labs", website: "https://brightpath.dev", description: "We build booking tools." };

describe("validateCompany", () => {
  it("accepts a valid company and trims the values", () => {
    const result = validateCompany({ name: "  Brightpath Labs ", website: " https://brightpath.dev ", description: " Hi " });
    expect(result).toEqual({
      ok: true,
      data: { name: "Brightpath Labs", website: "https://brightpath.dev", description: "Hi" },
    });
  });

  it("saves empty optional fields as null", () => {
    const result = validateCompany({ name: "Brightpath Labs", website: "  ", description: "" });
    expect(result).toEqual({ ok: true, data: { name: "Brightpath Labs", website: null, description: null } });
  });

  it("requires a name", () => {
    const result = validateCompany({ ...validCompany, name: "   " });
    expect(result).toEqual({ ok: false, errors: { name: "Enter your company name." } });
  });

  it("rejects a name that is too long", () => {
    const result = validateCompany({ ...validCompany, name: "x".repeat(COMPANY_NAME_MAX + 1) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.name).toMatch(/120 characters or fewer/);
  });

  it.each([
    ["no https://", "brightpath.dev"],
    ["a javascript: link", "javascript:alert(1)"],
    ["an ftp link", "ftp://brightpath.dev"],
    ["no dot in the host", "https://localhost"],
  ])("rejects a website with %s", (_label, website) => {
    const result = validateCompany({ ...validCompany, website });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.website).toBeDefined();
  });

  it("rejects a description that is too long", () => {
    const result = validateCompany({ ...validCompany, description: "x".repeat(COMPANY_DESCRIPTION_MAX + 1) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.description).toBeDefined();
  });

  it("reports every invalid field at once", () => {
    const result = validateCompany({ name: "", website: "nope", description: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["name", "website"]);
  });
});

// The first bytes ("magic numbers") of each image type.
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const WEBP = new TextEncoder().encode("RIFF\0\0\0\0WEBP");
const SVG = new TextEncoder().encode("<svg xmlns=");
const GIF = new TextEncoder().encode("GIF89a000000");

describe("detectLogoType", () => {
  it.each([
    ["PNG", PNG, "png"],
    ["JPEG", JPEG, "jpg"],
    ["WebP", WEBP, "webp"],
  ])("recognises a %s file", (_label, bytes, extension) => {
    expect(detectLogoType(bytes)?.extension).toBe(extension);
  });

  it.each([
    ["an SVG (can contain scripts)", SVG],
    ["a GIF", GIF],
    ["an empty file", new Uint8Array()],
  ])("rejects %s", (_label, bytes) => {
    expect(detectLogoType(bytes)).toBeNull();
  });
});

describe("validateLogo", () => {
  it("accepts a small PNG", () => {
    expect(validateLogo(5_000, PNG)).toEqual({ ok: true, type: { mimeType: "image/png", extension: "png" } });
  });

  it("accepts a file of exactly 2 MB", () => {
    expect(validateLogo(LOGO_MAX_BYTES, JPEG).ok).toBe(true);
  });

  it("rejects a file over 2 MB", () => {
    expect(validateLogo(LOGO_MAX_BYTES + 1, JPEG)).toEqual({ ok: false, error: "The logo must be 2 MB or smaller." });
  });

  it("rejects an empty upload", () => {
    expect(validateLogo(0, new Uint8Array())).toEqual({ ok: false, error: "Choose an image to upload." });
  });

  it("rejects an SVG renamed to .png, because it checks the bytes, not the name", () => {
    expect(validateLogo(300, SVG)).toEqual({ ok: false, error: "The logo must be a PNG, JPEG, or WebP image." });
  });
});
