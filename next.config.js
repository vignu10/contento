/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  webpack: (config) => {
    config.externals = config.externals || [];
    return config;
  }
};

module.exports = nextConfig;
