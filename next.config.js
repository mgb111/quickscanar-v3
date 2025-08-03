/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Commented out for development
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['localhost', 'your-project.supabase.co'],
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