// src/components/CopyrightYear.tsx
import { cacheLife } from "next/cache";

export async function CopyrightYear() {
  "use cache";
  cacheLife("max"); // Cache indefinitely; it only changes once a year
  return <>{new Date().getFullYear()}</>;
}