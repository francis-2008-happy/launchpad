// The icon iPhones and iPads use when someone adds LaunchPad to their home
// screen (issue #29). Next.js turns this into /apple-icon.png at build time.
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#047857",
        }}
      >
        {/* The LaunchPad logo mark, drawn larger (same shapes as LogoMark in icons.tsx). */}
        <svg width="132" height="132" viewBox="0 0 32 32">
          <path d="M16 7l6 7h-4v6h-4v-6h-4l6-7z" fill="#ffffff" />
          <rect x="9" y="22.5" width="14" height="2.5" rx="1.25" fill="#f5a524" />
        </svg>
      </div>
    ),
    size,
  );
}
