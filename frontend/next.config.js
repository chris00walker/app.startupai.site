/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to support server features (OAuth, API routes)
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Enable dev indicators for component selection
  devIndicators: {
    position: 'bottom-right',
  },
  pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js', 'tsx', 'ts', 'jsx', 'js'].filter(
    (extension) => !extension.includes('test') && !extension.includes('spec')
  ),
}

module.exports = nextConfig
