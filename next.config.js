/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  optimizeFonts: false,
  webpack: (config) => {
    config.cache = false; // 👈 Disables problematic cache
    return config;
  },
};

module.exports = nextConfig;
