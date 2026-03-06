/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  webpack: (config) => {
    config.externals = config.externals || [];
    return config;
  }
};

module.exports = nextConfig;
