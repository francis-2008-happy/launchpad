// components/Footer.tsx
import { Suspense } from "react";
import { CopyrightYear } from "./CopyrightYear";

export default function Footer() {
  return (
    <footer className="w-full border-t border-foreground/10 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-foreground/60">
            &copy;{" "}
            <Suspense fallback={<span className="inline-block w-8" aria-hidden="true" />}>
              <CopyrightYear />
            </Suspense>{" "}
            LaunchPad. Proof-of-skill hiring.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-foreground/60 hover:text-foreground">About</a>
            <a href="#" className="text-sm text-foreground/60 hover:text-foreground">Privacy</a>
            <a href="#" className="text-sm text-foreground/60 hover:text-foreground">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}