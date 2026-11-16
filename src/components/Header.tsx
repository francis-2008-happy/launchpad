// src/components/Header.tsx
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { LogoMark } from "@/components/icons";
import { MobileMenu } from "@/components/mobile-menu";
import { ThemeToggle } from "@/components/theme-toggle";

// Links to the landing page sections. Shown in the header from `md` up, and in
// the mobile menu on phones (issue #28).
const navLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#candidates", label: "For candidates" },
  { href: "/#employers", label: "For employers" },
];

// This is just a helper inside this file to safely read the login status
async function UserNav() {
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName = "User";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, github_username")
      .eq("id", user.id)
      .single();
    
    displayName = profile?.full_name || profile?.github_username || user.email?.split("@")[0] || "User";
  }

  if (!user) {
    return (
      <Link href="/sign-in" className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover">
        Sign In
      </Link>
    );
  }

  return (
    <>
      {/* Shown in the desktop header and in the mobile menu. */}
      <span className="max-w-40 truncate text-sm font-medium text-muted">Hi, {displayName}</span>
      <form action={signOut}>
        <button type="submit" className="inline-flex min-h-11 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold transition hover:border-primary/40 hover:bg-primary-soft">
          Sign Out
        </button>
      </form>
    </>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <nav aria-label="Main" className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <LogoMark className="h-8 w-8" />
          LaunchPad
        </Link>

        {/* Links to landing page sections, shown from tablet size up. */}
        <ul className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="transition hover:text-foreground">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* From `md` up: sign in / sign out and the theme toggle sit in the header. */}
        <div className="hidden items-center gap-3 md:flex lg:gap-4">
          {/* This Suspense boundary is what prevents the cookies() error */}
          <Suspense fallback={<div className="h-11 w-24 animate-pulse rounded-lg bg-surface" />}>
            <UserNav />
          </Suspense>
          <ThemeToggle />
        </div>

        {/* On phones they move into the menu, with the section links (issue #28). */}
        <MobileMenu
          links={navLinks}
          userNav={
            <Suspense fallback={<div className="h-11 w-24 animate-pulse rounded-lg bg-surface" />}>
              <UserNav />
            </Suspense>
          }
        />
      </nav>
    </header>
  );
}
