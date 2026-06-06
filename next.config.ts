import createMDX from '@next/mdx'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
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
