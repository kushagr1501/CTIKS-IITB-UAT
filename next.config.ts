import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  distDir: process.env.CTIKS_TEST_DIST_DIR ?? '.next',
  serverExternalPackages: ['argon2', '@prisma/client', '@prisma/adapter-pg', 'pg'],
  async headers() {
    const base = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      {
        key: 'Content-Security-Policy',
        value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
      },
    ];
    if (process.env.NODE_ENV === 'production')
      base.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000' });
    return [
      { source: '/:path*', headers: base },
      { source: '/admin/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] },
      { source: '/faculty/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
  async redirects() {
    return [
      { source: '/about', destination: '/about-us', permanent: true },
      { source: '/eventspage', destination: '/events', permanent: true },
    ];
  },
};

export default nextConfig;
