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
  // Webpack Konfiguration für optionale Dependencies
  webpack: (config, { isServer }) => {
    // Canvas als optionale Dependency behandeln
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        canvas: false,
      };
    }
    
    // Canvas als external wenn auf Server
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'canvas'
      });
    }
    
    return config;
  },
}

module.exports = nextConfig
