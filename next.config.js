/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {},
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Vercel Optimierungen für bessere Performance
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
}

module.exports = nextConfig
