/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Dev Mode Enabled 
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js', 'tsx', 'ts', 'jsx', 'js'].filter(
    (extension) => !extension.includes('test') && !extension.includes('spec')
  ),
}

module.exports = nextConfig
