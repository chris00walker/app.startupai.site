/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to support server-side authentication
  // Static export doesn't support dynamic routes with cookies/auth
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Enable dev indicators for component selection
  devIndicators: {
    appIsrStatus: true,
    buildActivityPosition: 'bottom-right',
  },
  pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js', 'tsx', 'ts', 'jsx', 'js'].filter(
    (extension) => !extension.includes('test') && !extension.includes('spec')
  ),
}

module.exports = nextConfig
