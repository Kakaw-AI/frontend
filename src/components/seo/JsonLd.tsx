type JsonLdData = Record<string, unknown>;

/**
 * Renders a JSON-LD structured-data block. Accepts a single schema object or
 * an array of them (rendered as one script each). Server component — safe to
 * embed in layouts and server pages.
 */
export function JsonLd({ data }: { data: JsonLdData | JsonLdData[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Schema is built from trusted, static constants — no user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
