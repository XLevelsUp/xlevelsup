import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    optimizeCss: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // The employee portal clocks in/out with a geolocation fix, so this
          // app — unlike the marketing site — must allow the Geolocation API.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          // admin.xlevelsup.com is internal. Belt-and-braces alongside the
          // `robots` metadata in the root layout.
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default nextConfig;
