// src/components/Header.tsx
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

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
      <Link href="/sign-in" className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition hover:opacity-90 sm:px-4">
        Sign In
      </Link>
    );
  }

  return (
    <>
      <span className="text-sm font-medium text-foreground/70">Hi, {displayName}</span>
      <form action={signOut}>
        <button type="submit" className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition hover:opacity-90 sm:px-4">
          Sign Out
        </button>
      </form>
    </>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-foreground/10 bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold tracking-tight">LaunchPad</Link>
        
        <div className="flex items-center gap-4 md:gap-6">
          {/* This Suspense boundary is what prevents the cookies() error */}
          <Suspense fallback={<div className="h-9 w-24 rounded-md bg-foreground/10 animate-pulse" />}>
            <UserNav />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}
