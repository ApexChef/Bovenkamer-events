/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: Removed 'output: export' to enable API routes for authentication
  // Netlify supports Next.js API routes natively
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
