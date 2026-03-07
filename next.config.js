/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: output: 'standalone' is removed as Railway's native Next.js builder
  // handles production builds automatically without standalone mode
  experimental: {
    serverComponentsExternalPackages: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    // instrumentationHook: true, // Commented out for Railway compatibility
  },
  webpack: (config) => {
    config.externals = config.externals || [];
    return config;
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Control referrer information
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable unnecessary browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()'
          },
          // Basic CSP - adjust as needed for your app
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.openai.com https://noembed.com",
              "frame-ancestors 'none'",
            ].join('; ')
          },
          // XSS Protection (legacy but still useful)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
