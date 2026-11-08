import type { NextConfig } from "next";

// Extraire le hostname de l'API pour l'autoriser dans next/image
// On lit directement la variable d'environnement pour éviter les problèmes
// de timing avec l'import de api-url.ts en mode développement
const apiHostname = (() => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return new URL(apiUrl).hostname;
  } catch {
    return 'localhost';
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // API locale (dev) + API staging/prod (Coolify)
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: apiHostname },
    ],
    unoptimized: true,
    minimumCacheTTL: 60,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  serverExternalPackages: [],
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: '/media/:path*',
        destination: `${apiUrl}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
