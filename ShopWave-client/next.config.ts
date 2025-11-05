import type { NextConfig } from 'next';

const nextConfig = {
  /* config options here */
  // We terminate compression at the HTTP/2 proxy with Brotli/gzip to avoid double-compression
  compress: false,
  modularizeImports: {
    // Transform date-fns named imports to direct path imports for better tree-shaking
    'date-fns': {
      transform: 'date-fns/{{member}}',
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // Allow local backend dev images (HTTPS on 5001 and HTTP on 5000)
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '5001',
        pathname: '/uploads/**',
      },
      // Also allow direct IP address access (in case URLs resolve to 127.0.0.1)
      {
        protocol: 'https',
        hostname: '127.0.0.1',
        port: '5001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
    // Disable built-in image optimization for the whole project. This forces
    // Next to render <img> tags directly (no server-side optimization).
    // Useful when your backend uses self-signed certs or when you want the
    // browser to fetch images directly.
    unoptimized: true,
  },
  async headers() {
    // Caching strategy:
    // - Long-term immutable cache for hashed/static assets
    // - No-cache for HTML documents to always fetch latest
    return [
      // Next.js build output (hashed chunks)
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Image optimizer responses can be cached for a long time (they include URL-based versioning)
      {
        // image optimizer responses are served from the /_next/image path with params
        source: '/_next/image/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Public banner assets (static files)
      {
        source: '/banner/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // All HTML documents should not be cached by the browser
      // We detect HTML navigations via the Accept header
      {
        source: '/:path*',
        has: [
          { type: 'header', key: 'Accept', value: '.*text/html.*' },
        ],
        headers: [
          { key: 'Cache-Control', value: 'no-cache, must-revalidate' },
        ],
      },
    ];
  },
  async rewrites() {
    // Dev proxy: forward same-origin calls to backend to avoid CORS and hard-coded URLs
    // Adjust target in env for other environments as needed
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://localhost:5001/api/v1/:path*',
      },
      {
        source: '/auth/:path*',
        destination: 'https://localhost:5001/auth/:path*',
      },
    ];
  },
} as unknown as NextConfig;

export default nextConfig;
