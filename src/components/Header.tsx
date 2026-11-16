// components/Header.tsx
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-foreground/10 bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold tracking-tight">
          LaunchPad
        </Link>
        
        {/* Visible on all screen sizes; spacing and button text shrink on phones. */}
        <div className="flex items-center gap-4 md:gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <button
            type="button"
            disabled
            className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background opacity-60 cursor-not-allowed sm:px-4"
          >
            Sign In<span className="hidden sm:inline"> (Coming Soon)</span>
          </button>
        </div>
      </nav>
    </header>
  );
}