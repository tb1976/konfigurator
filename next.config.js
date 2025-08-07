/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Vercel-optimierte Bildkonfiguration
  images: {
    unoptimized: true, // Für Vercel Edge Runtime
  },
  // Client-side Canvas Support für Vercel
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Server-side Canvas Unterstützung entfernen für Vercel
      config.externals = config.externals || [];
      config.externals.push('canvas');
    } else {
      // Client-side fallbacks für Browser-Canvas
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        canvas: false,
      };
    }
    
    return config;
  },
  // Vercel Edge Runtime Optimierungen
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // Kein output: 'standalone' für Vercel - verursacht Redirect-Loops
}

module.exports = nextConfig
