// The main call-to-action button on the landing page.
// Signed out: "Sign in with GitHub". Signed in: "Go to your dashboard", linking
// to the dashboard for the user's role. It reads the session cookie, so the page
// wraps it in <Suspense> and shows <PrimaryCtaSkeleton /> while it loads.
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dashboardPathFor } from "@/lib/roles";
import { ArrowRightIcon, GitHubIcon } from "@/components/icons";

// "light" is for use on the dark green call-to-action panel at the bottom of the page.
type Variant = "primary" | "light";

const styles: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  light: "bg-white text-panel hover:bg-highlight-soft",
};

const base =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-semibold transition sm:w-auto";

// signedOutLabel lets the employer version of the hero say "Sign in to post a job" (issue #29).
export async function PrimaryCta({
  variant = "primary",
  signedOutLabel = "Sign in with GitHub",
}: {
  variant?: Variant;
  signedOutLabel?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    return (
      <Link href={dashboardPathFor(profile?.role)} className={`${base} ${styles[variant]}`}>
        Go to your dashboard
        <ArrowRightIcon className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <Link href="/sign-in" className={`${base} ${styles[variant]}`}>
      <GitHubIcon className="h-5 w-5" />
      {signedOutLabel}
    </Link>
  );
}

// Same size as the button, so the layout does not jump when it loads.
export function PrimaryCtaSkeleton({ variant = "primary" }: { variant?: Variant }) {
  const tone = variant === "light" ? "bg-white/40" : "bg-primary/40";
  return <span aria-hidden="true" className={`${base} ${tone} animate-pulse sm:w-56`} />;
}
