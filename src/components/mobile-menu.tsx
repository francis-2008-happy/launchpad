// The menu button and drop-down menu for phones (issue #28). It is hidden from
// the `md` breakpoint up, where the links fit in the header.
//
// Accessibility:
//   - The button says whether the menu is open (aria-expanded) and which
//     element it controls (aria-controls).
//   - Opening the menu moves keyboard focus to its first link.
//   - Escape closes it and puts focus back on the button.
//   - Tapping a link, or anywhere outside the menu, closes it.
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";

type NavLink = { href: string; label: string };

export function MobileMenu({ links, userNav }: { links: NavLink[]; userNav: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Move focus into the menu so keyboard and screen reader users land in it.
    menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const clickedInside = menuRef.current?.contains(target) || buttonRef.current?.contains(target);
      if (!clickedInside) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-card transition hover:border-primary/40 hover:bg-primary-soft"
      >
        {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
      </button>

      {open && (
        <div
          ref={menuRef}
          id="mobile-menu"
          // Any click on a link or button inside closes the menu (the sign-out form still submits).
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a, button[type='submit']")) setOpen(false);
          }}
          className="absolute inset-x-0 top-full border-b border-border bg-background px-4 pb-6 pt-2 shadow-lg"
        >
          <ul className="grid grid-cols-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex min-h-12 items-center border-b border-border text-base font-semibold transition hover:text-primary-text"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {userNav}
            <ThemeToggle showLabel />
          </div>
        </div>
      )}
    </div>
  );
}
