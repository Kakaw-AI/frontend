import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-3">
        <p className="font-label text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          404
        </p>
        <h1 className="font-headline text-4xl text-primary">
          This page does not exist
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-on-surface/65">
          The link may be old, or the page may have moved.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-on-primary transition-opacity hover:opacity-90"
      >
        Go home
      </Link>
    </main>
  );
}
