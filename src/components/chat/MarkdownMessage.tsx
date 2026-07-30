import { memo, useMemo } from "react";
import { parseMarkdownBlocks } from "@/components/chat/chat-formatting";

function renderInlineMarkdown(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyPrefix}-strong-${index}`}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${keyPrefix}-code-${index}`}
          className="rounded bg-surface-container-lowest px-1.5 py-0.5 font-mono text-[0.92em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={`${keyPrefix}-text-${index}`}>{part}</span>;
  });
}

export const MarkdownMessage = memo(function MarkdownMessage({
  content,
}: {
  content: string;
}) {
  // Re-parsing the full markdown of every message on every streamed token was
  // the single most expensive thing in the render path.
  const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocks.map((block, blockIndex) => {
        if (block.type === "heading") {
          const className =
            block.level === 1
              ? "text-xl font-semibold tracking-[-0.02em]"
              : block.level === 2
                ? "text-lg font-semibold tracking-[-0.02em]"
                : "text-base font-semibold";

          return (
            <p key={`block-${blockIndex}`} className={className}>
              {renderInlineMarkdown(block.text, `block-${blockIndex}`)}
            </p>
          );
        }

        if (block.type === "unordered-list") {
          return (
            <ul key={`block-${blockIndex}`} className="list-disc space-y-1.5 pl-5">
              {block.items.map((item, lineIndex) => (
                <li key={`block-${blockIndex}-item-${lineIndex}`}>
                  {renderInlineMarkdown(item, `block-${blockIndex}-item-${lineIndex}`)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "ordered-list") {
          return (
            <ol key={`block-${blockIndex}`} className="list-decimal space-y-1.5 pl-5">
              {block.items.map((item, lineIndex) => (
                <li key={`block-${blockIndex}-item-${lineIndex}`}>
                  {renderInlineMarkdown(item, `block-${blockIndex}-item-${lineIndex}`)}
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === "code") {
          return (
            <div
              key={`block-${blockIndex}`}
              className="overflow-x-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3"
            >
              {block.language ? (
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface/45">
                  {block.language}
                </p>
              ) : null}
              <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-6 text-on-surface/80">
                {block.code}
              </pre>
            </div>
          );
        }

        if (block.type === "table") {
          return (
            <div
              key={`block-${blockIndex}`}
              className="overflow-x-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest"
            >
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-surface-container-high text-on-surface/80">
                  <tr>
                    {block.headers.map((header, headerIndex) => (
                      <th
                        key={`block-${blockIndex}-header-${headerIndex}`}
                        className="border-b border-outline-variant/15 px-4 py-2.5 font-semibold"
                      >
                        {renderInlineMarkdown(header, `block-${blockIndex}-header-${headerIndex}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`block-${blockIndex}-row-${rowIndex}`} className="border-b border-outline-variant/10 last:border-b-0">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`block-${blockIndex}-row-${rowIndex}-cell-${cellIndex}`}
                          className="px-4 py-2.5 align-top"
                        >
                          {renderInlineMarkdown(cell, `block-${blockIndex}-row-${rowIndex}-cell-${cellIndex}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <p key={`block-${blockIndex}`} className="whitespace-pre-wrap">
            {renderInlineMarkdown(block.text, `block-${blockIndex}`)}
          </p>
        );
      })}
    </div>
  );
});
