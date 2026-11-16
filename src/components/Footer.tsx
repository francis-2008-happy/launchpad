// components/Footer.tsx
import Link from "next/link";
import { Suspense } from "react";
import { CopyrightYear } from "./CopyrightYear";
import { LogoMark } from "./icons";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#candidates", label: "For candidates" },
  { href: "/#employers", label: "For employers" },
  { href: "/sign-in", label: "Sign in" },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-10 sm:px-6 md:flex-row md:justify-between lg:px-8">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <LogoMark className="h-7 w-7" />
            LaunchPad
          </Link>
          <p className="text-sm text-muted">
            &copy;{" "}
            <Suspense fallback={<span className="inline-block w-8" aria-hidden="true" />}>
              <CopyrightYear />
            </Suspense>{" "}
            LaunchPad. Proof-of-skill hiring.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-1">
            {links.map((link) => (
              <li key={link.href}>
                {/* py-3 gives each link a comfortable 44px tap height on phones. */}
                <Link href={link.href} className="inline-block py-3 text-sm text-muted transition hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
