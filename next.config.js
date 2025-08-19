/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['localhost', 'your-project.supabase.co'],
  },
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium']
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  // Configure server to handle larger requests
  serverRuntimeConfig: {
    bodySizeLimit: '100mb',
  },
}

module.exports = nextConfig 