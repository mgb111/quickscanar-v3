/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
    serverActions: {
      bodySizeLimit: '500mb'
    }
  },
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
    responseLimit: '100mb',
  },
  images: {
    unoptimized: true,
    domains: ['localhost', 'your-project.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/a/**',
      },
      {
        protocol: 'https',
        hostname: 'pmsqoujpagfebrsrzdpl.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/marker_images/**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
}

module.exports = nextConfig