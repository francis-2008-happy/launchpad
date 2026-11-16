// A submit button that shows different text while its form is being submitted.
// useFormStatus only works in a Client Component placed inside the <form>, so
// this small component lets Server Components (like the dashboard) use it.
"use client";

import { useFormStatus } from "react-dom";

export function PendingButton({
  children,
  pendingText,
  className = "",
}: {
  children: React.ReactNode;
  pendingText: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}>
      {pending ? pendingText : children}
    </button>
  );
}
