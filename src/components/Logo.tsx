import Link from "next/link";

/** The Kakaw wordmark: the name followed by a red period. Not a link; see Logo. */
export function Wordmark({ className = "text-2xl" }: { className?: string }) {
  return (
    <span
      aria-label="Kakaw"
      className={`inline-flex items-baseline font-headline leading-none text-on-surface ${className}`}
    >
      Kakaw
      <span aria-hidden="true" className="text-dot">
        .
      </span>
    </span>
  );
}

/** The wordmark as a link home. */
export function Logo({ className = "text-2xl" }: { className?: string }) {
  return (
    <Link href="/" aria-label="Kakaw" className="inline-flex">
      <Wordmark className={className} />
    </Link>
  );
}
