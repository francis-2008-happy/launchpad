// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { themeInitScript } from "@/lib/theme";

// Plus Jakarta Sans: a friendly, professional sans-serif for all text.
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const description = "Proof-of-skill hiring platform that builds verified developer profiles from real GitHub code.";

export const metadata: Metadata = {
  // Share images need full links (https://...), so Next.js needs the site's address.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "LaunchPad",
  description,
  // Link previews on WhatsApp, Slack, LinkedIn, and X (issue #29). The image
  // itself comes from opengraph-image.tsx and twitter-image.tsx.
  openGraph: {
    title: "LaunchPad: get hired for the code you've already written",
    description,
    siteName: "LaunchPad",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LaunchPad: get hired for the code you've already written",
    description,
  },
};

// Runs before the page is shown: applies the saved theme (issue #28) and adds a
// "js" class to <html>, which the scroll animations use (issue #29). Without
// JavaScript the class is missing, so content is never hidden waiting for an
// animation that cannot run.
const initScript = `${themeInitScript}
document.documentElement.classList.add("js");`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the script below may add data-theme and a class to <html>
    // before React loads, which is expected and not a bug.
    <html lang="en" className={`${jakarta.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Applies the saved light/dark theme before the page is shown, so there is no flash (issue #28). */}
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
      </head>
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col">
        {/* Skip link (issue #28): the first thing keyboard users reach with Tab.
            It stays hidden until it gets focus, then jumps past the header. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <Header />
        {/* tabIndex={-1} lets the skip link move keyboard focus here. */}
        <div id="main-content" tabIndex={-1} className="flex flex-1 scroll-mt-20 flex-col outline-none">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
