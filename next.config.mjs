import { createMDX } from 'fumadocs-mdx/next'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // lucide-react is optimized by default in this Next version, so only the
    // packages outside that list need listing here.
    optimizePackageImports: ['@base-ui/react'],
  },
  images: {
    // OAuth profile avatar hosts (Better Auth: GitHub + Google).
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    // Baseline security headers for all routes. HSTS is already served by the
    // Vercel edge, so it is intentionally omitted here.
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
  async rewrites() {
    // Every docs page has a Markdown twin for AI agents: /docs/quickstart.md,
    // and a section dump at /docs/<section>/llms-full.txt.
    return [
      { source: '/docs.md', destination: '/llms.mdx/docs.md' },
      { source: '/docs/:path*.md', destination: '/llms.mdx/docs/:path*.md' },
      { source: '/docs/:path*.txt', destination: '/llms.mdx/docs/:path*.txt' },
    ]
  },
  async redirects() {
    // The four pages of the old docs, kept alive for links and search results.
    return [
      { source: '/docs/getting-started', destination: '/docs/quickstart', permanent: true },
      { source: '/docs/connect-database', destination: '/docs/data/postgres', permanent: true },
      { source: '/docs/setup-llm', destination: '/docs/models/providers', permanent: true },
      { source: '/docs/using-chat', destination: '/docs/chat/asking-questions', permanent: true },
    ]
  },
}

// Fumadocs MDX is ESM-only, hence this file is .mjs rather than .ts.
const withMDX = createMDX()

export default withMDX(nextConfig)
