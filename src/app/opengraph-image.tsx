// The preview image shown when someone shares a LaunchPad link on WhatsApp,
// Slack, LinkedIn, X, and similar apps (issue #29). Next.js turns this into a
// 1200x630 PNG at build time and adds the matching <meta> tags to every page.
import { ImageResponse } from "next/og";

export const alt = "LaunchPad: get hired for the code you've already written";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const skills = ["TypeScript", "React", "PostgreSQL", "Testing"];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#062f25",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo and name */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#047857" />
            <path d="M16 7l6 7h-4v6h-4v-6h-4l6-7z" fill="#ffffff" />
            <rect x="9" y="22.5" width="14" height="2.5" rx="1.25" fill="#f5a524" />
          </svg>
          <span style={{ fontSize: 44, fontWeight: 700 }}>LaunchPad</span>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            Get hired for the code
          </div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            you&apos;ve&nbsp;<span style={{ color: "#f5a524" }}>already written.</span>
          </div>
          <div style={{ marginTop: 28, fontSize: 32, color: "rgba(255,255,255,0.75)" }}>
            Verified skill profiles built from real GitHub code.
          </div>
        </div>

        {/* Verified skill chips, like on a LaunchPad profile */}
        <div style={{ display: "flex", gap: 16 }}>
          {skills.map((skill) => (
            <div
              key={skill}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 24px",
                borderRadius: 999,
                background: "rgba(16,185,129,0.18)",
                color: "#6ee7b7",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {/* A drawn check mark: the built-in font has no ✓ character. */}
              <svg width="26" height="26" viewBox="0 0 24 24">
                <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#6ee7b7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {skill}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
