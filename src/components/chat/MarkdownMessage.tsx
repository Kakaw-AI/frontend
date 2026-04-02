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

export function MarkdownMessage({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content);

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

        return (
          <p key={`block-${blockIndex}`} className="whitespace-pre-wrap">
            {renderInlineMarkdown(block.text, `block-${blockIndex}`)}
          </p>
        );
      })}
    </div>
  );
}
