import Link from "next/link";

/** The Kakaw wordmark: the name plus the brand pod (a lens with a centre seam), sitting on the baseline. */
export function Logo({ className = "text-2xl" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-baseline font-headline leading-none text-on-surface ${className}`}
    >
      Kakaw
      <svg
        aria-hidden="true"
        viewBox="0 0 24 32"
        className="ml-[0.1em] h-[0.62em] w-[0.47em] self-baseline"
      >
        <path
          d="M12 0C20 5 20 27 12 32C4 27 4 5 12 0Z"
          fill="var(--color-pod)"
        />
        <path
          d="M12 0V32"
          stroke="var(--background)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </Link>
  );
}
