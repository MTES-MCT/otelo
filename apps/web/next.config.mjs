/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@shared'],
  turbopack: {},
  output: 'standalone',

  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:4200'}/api/auth/:path*`,
      },
    ]
  },

  webpack: (config) => {
    config.module.rules.push({
      test: /\.woff2$/,
      type: 'asset/resource',
    })
    return config
  },
}

export default nextConfig
