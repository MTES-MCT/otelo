/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@shared'],
  turbopack: {},
  output: 'standalone',
  
  webpack: (config) => {
    config.module.rules.push({
      test: /\.woff2$/,
      type: 'asset/resource',
    })
    return config
  },
}

export default nextConfig
