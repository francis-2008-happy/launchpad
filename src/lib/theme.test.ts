// Unit tests for the theme helpers (issue #28).
import { THEME_STORAGE_KEY, isTheme, nextTheme, themeInitScript } from "@/lib/theme";

describe("nextTheme", () => {
  it("cycles system -> light -> dark -> system", () => {
    expect(nextTheme("system")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("system");
  });
});

describe("isTheme", () => {
  it.each(["system", "light", "dark"])("accepts %s", (value) => {
    expect(isTheme(value)).toBe(true);
  });

  it.each([null, "", "blue", "DARK", 1])("rejects %p", (value) => {
    expect(isTheme(value)).toBe(false);
  });
});

describe("themeInitScript", () => {
  it("reads the same storage key the toggle writes", () => {
    expect(themeInitScript).toContain(THEME_STORAGE_KEY);
  });
});
