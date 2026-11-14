import Link from "next/link";

/** The Kakaw wordmark: the name plus a pink dot sitting on the baseline. */
export function Logo({ className = "text-2xl" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-baseline font-headline leading-none text-on-surface ${className}`}
    >
      Kakaw
      <span
        aria-hidden="true"
        className="ml-[0.06em] inline-block size-[0.28em] rounded-full bg-chart-1"
      />
    </Link>
  );
}
