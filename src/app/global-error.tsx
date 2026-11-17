"use client";

// Replaces the root layout when the layout itself fails, so it has to bring its
// own <html> and <body> and cannot rely on the app's stylesheet or providers.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: 'Figtree, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
          color: "#2a1810",
          background: "#f6eee2",
        }}
      >
        <title>Something went wrong | Kakaw AI</title>
        <h1 style={{ margin: 0, fontSize: "1.75rem" }}>Something went wrong</h1>
        <p style={{ margin: 0, maxWidth: "28rem", lineHeight: 1.6, opacity: 0.7 }}>
          Kakaw AI could not load. Try again, and if it keeps happening, reload
          the page.
        </p>
        {error.digest ? (
          <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.45 }}>
            Reference: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => unstable_retry()}
          style={{
            border: 0,
            borderRadius: "8px",
            padding: "0.6rem 1.4rem",
            font: "inherit",
            fontWeight: 600,
            color: "#f6eee2",
            background: "#2a1810",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
