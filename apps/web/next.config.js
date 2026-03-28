/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.vercel.com',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['stripe'],
  },
}

module.exports = nextConfig
