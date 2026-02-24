/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://sdk.minepi.com https://api.minepi.com https://vercel.live; frame-ancestors 'self' https://sandbox.minepi.com https://*.minepi.com https://*.vercel.app",
          },
        ],
      },
    ];
  },
};

export default nextConfig
