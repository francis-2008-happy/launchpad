// Shows a company's logo, or the first letter of its name when there is no logo
// yet (issue #13). Used on the company profile page and the employer dashboard,
// and later on job listings.
import Image from "next/image";

export function CompanyLogo({ name, logoUrl, size = 64 }: { name: string; logoUrl: string | null; size?: number }) {
  if (logoUrl) {
    return (
      <span
        className="relative block shrink-0 overflow-hidden rounded-xl border border-border bg-white"
        style={{ width: size, height: size }}
      >
        <Image src={logoUrl} alt={`${name} logo`} fill sizes={`${size}px`} className="object-contain p-1" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-xl bg-primary-soft font-extrabold text-primary-text"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
