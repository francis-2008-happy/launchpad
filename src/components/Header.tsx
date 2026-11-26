// src/components/Header.tsx
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { LogoMark } from "@/components/icons";
import { MobileMenu } from "@/components/mobile-menu";
import { ThemeToggle } from "@/components/theme-toggle";

// Links shown in the header from `lg` up, and in the mobile menu on phones and
// tablets (issues #28, #67). "Browse jobs" opens job search (issue #67); the rest are landing
// page sections.
const navLinks = [
  { href: "/jobs", label: "Browse jobs" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#candidates", label: "For candidates" },
  { href: "/#employers", label: "For employers" },
];

// This is just a helper inside this file to safely read the login status
async function UserNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName = "User";
  let applicationCount = 0;
  let role: string | null = null;
  if (user) {
    const [{ data: profile }, applications] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, github_username, role")
        .eq("id", user.id)
        .single(),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("candidate_id", user.id),
    ]);
    
    displayName = profile?.full_name || profile?.github_username || user.email?.split("@")[0] || "User";
    role = profile?.role ?? null;
    if (role === "candidate") applicationCount = applications.count ?? 0;
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
      {role === "candidate" && (
        <Link
          href="/candidate/applications"
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-primary-text hover:bg-primary-soft"
        >
          Applications <span className="ml-1.5 rounded-full bg-primary-soft px-2 py-0.5 text-xs">{applicationCount}</span>
        </Link>
      )}
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

        {/* Shown from laptop size up. On tablets four links do not fit on one line. */}
        <ul className="hidden items-center gap-6 text-sm font-medium whitespace-nowrap text-muted lg:flex xl:gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="transition hover:text-foreground">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* From `lg` up: sign in / sign out and the theme toggle sit in the header. */}
        <div className="hidden items-center gap-4 lg:flex">
          {/* This Suspense boundary is what prevents the cookies() error */}
          <Suspense fallback={<div className="h-11 w-24 animate-pulse rounded-lg bg-surface" />}>
            <UserNav />
          </Suspense>
          <ThemeToggle />
        </div>

        {/* On phones and tablets they move into the menu, with the links (issue #28). */}
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
