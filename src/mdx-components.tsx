import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'

export function useMDXComponents(): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="font-headline text-4xl italic text-on-surface mb-6 mt-10 leading-tight">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="font-headline text-3xl italic text-on-surface mb-4 mt-8 leading-tight">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-headline text-2xl italic text-on-surface mb-3 mt-6 leading-tight">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-on-surface-variant leading-relaxed mb-4">{children}</p>
    ),
    a: ({ href, children }) => (
      <Link
        href={href ?? '#'}
        className="text-primary hover:underline underline-offset-4"
      >
        {children}
      </Link>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside space-y-1 mb-4 text-on-surface-variant">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside space-y-1 mb-4 text-on-surface-variant">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    code: ({ children }) => (
      <code className="bg-surface-container-high px-1.5 py-0.5 rounded text-sm font-mono text-on-surface">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="bg-surface-container-high p-4 rounded-xl overflow-x-auto text-sm font-mono mb-4">
        {children}
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 my-4 text-on-surface-variant italic">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="border-outline-variant/20 my-8" />,
  }
}
