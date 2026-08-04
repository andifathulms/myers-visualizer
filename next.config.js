/**
 * Static export for GitHub Pages. PRD §12.
 * basePath must match the repository name; `.nojekyll` is emitted into out/.
 */
const isProd = process.env.NODE_ENV === 'production'
const basePath = isProd ? '/myers-visualizer' : ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
}

module.exports = nextConfig
