/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Exclude test files from pages
  pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js', 'tsx', 'ts', 'jsx', 'js'].filter(
    (extension) => !extension.includes('test') && !extension.includes('spec')
  ),
}

module.exports = nextConfig
