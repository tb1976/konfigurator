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
  
  // 🔧 CORS Headers für Ninox Integration
  async headers() {
    return [
      {
        // Für alle API Routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*' // Erlaubt alle Origins (oder spezifisch: 'https://vdli.ninoxdb.com, https://*.ninoxdb.com')
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, Accept'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400' // 24 Stunden Cache für Preflight-Requests
          }
        ]
      },
      {
        // Zusätzliche Headers für den Konfigurator selbst (für Iframe-Integration)
        source: '/',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL' // Erlaubt Iframe-Einbettung
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *;" // Erlaubt Einbettung in alle Frames
          }
        ]
      },
      {
        // Headers für alle statischen Assets
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ];
  },
  
  // 🔧 Rewrites für Ninox API-Integration (optional)
  async rewrites() {
    return [
      // Für eventuelle API-Proxy-Needs
      {
        source: '/ninox-api/:path*',
        destination: 'https://api.ninox.com/v1/:path*'
      }
    ];
  }
}

module.exports = nextConfig