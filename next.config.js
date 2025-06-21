/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { 
    unoptimized: true 
  },
  experimental: {
    forceSwcTransforms: false,
  },
  webpack: (config, { dev }) => {
    config.cache = false;
    
    config.ignoreWarnings = [
      () => true,
    ];
    
    config.stats = {
      warnings: false,
      errors: false,
    };
    
    if (!dev) {
      config.devtool = false;
    }
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      buffer: false,
      util: false,
      url: false,
      querystring: false,
    };
    
    config.module.strictExportPresence = false;
    
    // Add SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    return config;
  },
  reactStrictMode: false,
};

module.exports = nextConfig;