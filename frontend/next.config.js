/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lucide-react'],
  output: 'standalone',
  
  // ✅ Add empty turbopack config to resolve the error
  turbopack: {},
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? '/api/backend/:path*'
          : 'http://localhost:5000/api/:path*',
      },
    ];
  },

  
};

module.exports = nextConfig;