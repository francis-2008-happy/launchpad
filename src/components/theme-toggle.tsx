// The sun / moon button that switches between System, Light, and Dark (issue #28).
// Each click moves to the next theme. The button's label tells screen reader
// users the current theme and what clicking will do.
"use client";

import { useSyncExternalStore } from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";
import { THEME_LABELS, THEME_STORAGE_KEY, isTheme, nextTheme, type Theme } from "@/lib/theme";

const THEME_EVENT = "launchpad-theme-change";

// Reads the saved theme. localStorage can throw in private browsing, so fall back to "system".
function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

function applyTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Not saved (private browsing), but it still applies to this page.
  }
  if (theme === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
  // Tell every toggle on the page (header and mobile menu) to update.
  window.dispatchEvent(new Event(THEME_EVENT));
}

// Re-render when the theme changes on this page or in another tab.
function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const icons = { system: MonitorIcon, light: SunIcon, dark: MoonIcon };

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  // The server cannot see localStorage, so it renders "system"; the browser then shows the saved theme.
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as Theme);
  const next = nextTheme(theme);
  const Icon = icons[theme];

  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={`Theme: ${THEME_LABELS[theme]}. Switch to ${THEME_LABELS[next]}.`}
      title={`Theme: ${THEME_LABELS[theme]}`}
      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-semibold transition hover:border-primary/40 hover:bg-primary-soft"
    >
      <Icon className="h-5 w-5" />
      {showLabel && <span aria-hidden="true">Theme: {THEME_LABELS[theme]}</span>}
    </button>
  );
}
