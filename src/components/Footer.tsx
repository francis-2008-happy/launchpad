// components/Footer.tsx
// Site footer. Redesigned in issue #57 so it reads well on phones:
//   - a brand block with a one-line description
//   - links in two labelled columns that stay side by side, even on small phones
//   - a bottom bar with the copyright, team credit, and "Back to top"
import Link from "next/link";
import { Suspense } from "react";
import { CopyrightYear } from "./CopyrightYear";
import { LogoMark } from "./icons";

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/jobs", label: "Browse jobs" },
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#try-it", label: "Try it with GitHub" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Get started",
    links: [
      { href: "/#candidates", label: "For developers" },
      { href: "/#employers", label: "For employers" },
      { href: "/sign-in", label: "Sign in" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr] md:gap-16">
          {/* Brand */}
          <div className="max-w-sm">
            <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-lg font-bold tracking-tight">
              <LogoMark className="h-8 w-8" />
              LaunchPad
            </Link>
            <p className="mt-3 text-muted">
              Verified skill profiles built from real GitHub code, so developers get hired for what they&apos;ve
              actually built.
            </p>
          </div>

          {/* Links: two columns side by side at every screen size. */}
          <nav aria-label="Footer" className="grid grid-cols-2 gap-6 sm:gap-10">
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="text-sm font-bold">{column.title}</h2>
                <ul className="mt-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      {/* min-h-11 gives each link a 44px tap height on phones. */}
                      <Link
                        href={link.href}
                        className="flex min-h-11 items-center text-sm text-muted transition hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p>
              &copy;{" "}
              <Suspense fallback={<span className="inline-block w-8" aria-hidden="true" />}>
                <CopyrightYear />
              </Suspense>{" "}
              LaunchPad. Proof-of-skill hiring.
            </p>
            <p>Built by Francis, Maxwell, and Godwin · BYU-Pathway CSE 499</p>
          </div>
          {/* Jumps to the top of the page content and moves keyboard focus there too. */}
          <a
            href="#main-content"
            className="inline-flex min-h-11 items-center gap-1.5 self-start font-semibold text-foreground transition hover:text-primary-text sm:self-auto"
          >
            Back to top
            <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
