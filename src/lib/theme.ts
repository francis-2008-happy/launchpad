// Light / dark / system theme (issue #28).
//
// The choice is saved in localStorage. "light" and "dark" are written to the
// <html> element as data-theme="light" or data-theme="dark", and globals.css
// picks the colors from that. "system" removes the attribute, so the device
// setting decides.

export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "launchpad-theme";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

// The theme the toggle switches to next: system -> light -> dark -> system.
export function nextTheme(current: Theme): Theme {
  return THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
}

export const THEME_LABELS: Record<Theme, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

// A tiny script that runs in <head> before the page is shown, so a saved
// theme is applied straight away with no flash of the wrong colors.
// It must be plain JavaScript in a string because it runs before React loads.
export const themeInitScript = `
try {
  var theme = localStorage.getItem("${THEME_STORAGE_KEY}");
  if (theme === "light" || theme === "dark") {
    document.documentElement.setAttribute("data-theme", theme);
  }
} catch (error) {}
`;
