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
  // Production Optimierungen
  images: {
    domains: ['localhost'],
    unoptimized: false, // Für bessere Performance
  },
  // Canvas Support für VPS
  webpack: (config, { isServer }) => {
    // Canvas nur auf Server verfügbar machen
    if (isServer) {
      config.externals = config.externals || [];
      // Canvas als externes Modul behandeln
      config.externals.push('canvas');
    } else {
      // Client-side fallbacks
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
  // Performance Optimierungen
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
}

module.exports = nextConfig
