import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.yupoo.com' },
      { protocol: 'https', hostname: 'photo.yupoo.com' },
      { protocol: 'https', hostname: 's2-ge.glbimg.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'mantosdofutebol.com.br' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
};

export default nextConfig;
