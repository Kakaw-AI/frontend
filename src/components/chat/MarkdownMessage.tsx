import { memo, useMemo } from "react";
import { parseInlineMarkdown, parseMarkdownBlocks, textDirection } from "@/components/chat/chat-formatting";

function renderInlineMarkdown(text: string, keyPrefix: string) {
  return parseInlineMarkdown(text).map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    switch (token.type) {
      case "strong":
        return <strong key={key}>{token.text}</strong>;
      case "em":
        return <em key={key}>{token.text}</em>;
      case "code":
        return (
          <code
            key={key}
            dir="ltr"
            className="rounded bg-surface-container-lowest px-1.5 py-0.5 font-mono text-[0.92em]"
          >
            {token.text}
          </code>
        );
      case "link":
        return (
          <a
            key={key}
            href={token.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="underline underline-offset-2 break-words"
          >
            {token.text}
          </a>
        );
      default:
        return <span key={key}>{token.text}</span>;
    }
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
  // One direction for the whole message: per-line dir="auto" flipped every
  // Arabic bullet that happened to start with an English name to LTR.
  const dir = useMemo(() => textDirection(content), [content]);

  return (
    <div dir={dir} className="space-y-2.5 text-sm leading-6">
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
            <ul key={`block-${blockIndex}`} className="list-disc space-y-1.5 ps-5">
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
            <ol key={`block-${blockIndex}`} className="list-decimal space-y-1.5 ps-5">
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
              dir="ltr"
              className="overflow-x-auto rounded-lg border border-border bg-surface-container-lowest px-3 py-2"
            >
              {block.language ? (
                <p className="mb-1 font-mono text-[11px] text-on-surface-variant">{block.language}</p>
              ) : null}
              <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-5 text-on-surface">
                {block.code}
              </pre>
            </div>
          );
        }

        if (block.type === "table") {
          return (
            <div
              key={`block-${blockIndex}`}
              className="overflow-x-auto rounded-lg border border-border bg-surface-container-lowest"
            >
              <table className="min-w-full border-collapse text-start text-[13px]">
                <thead className="bg-surface-container text-on-surface">
                  <tr>
                    {block.headers.map((header, headerIndex) => (
                      <th
                        key={`block-${blockIndex}-header-${headerIndex}`}
                       
                        className="border-b border-border px-3 py-1.5 font-semibold"
                      >
                        {renderInlineMarkdown(header, `block-${blockIndex}-header-${headerIndex}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`block-${blockIndex}-row-${rowIndex}`} className="border-b border-border/60 last:border-b-0">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`block-${blockIndex}-row-${rowIndex}-cell-${cellIndex}`}
                         
                          className="px-3 py-1.5 align-top"
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
