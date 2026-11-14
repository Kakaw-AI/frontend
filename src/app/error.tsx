"use client";

import Link from "next/link";
import { useEffect } from "react";

// Catches render errors in any page below the root layout, so a crash shows a
// way forward instead of a blank screen.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-3">
        <h1 className="font-headline text-4xl text-primary">
          Something went wrong
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-on-surface/65">
          The page hit an unexpected error. Your data is safe. Try again, and if
          it keeps happening, reload the page.
        </p>
        {error.digest ? (
          <p className="text-xs text-on-surface/40">Reference: {error.digest}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-on-primary transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-outline-variant/30 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-on-surface/70 transition-colors hover:text-primary"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
