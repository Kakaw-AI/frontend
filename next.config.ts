import createMDX from '@next/mdx'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
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
}

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    // GitHub-flavored markdown: pipe tables, strikethrough, autolinks.
    // Turbopack requires serializable options, so the plugin is referenced by
    // name (string) rather than an imported function.
    remarkPlugins: [['remark-gfm']],
  },
})

export default withMDX(nextConfig)
