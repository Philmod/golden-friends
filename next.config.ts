import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Hide Next.js dev indicator
  devIndicators: false,
  // Allow serving images from the data folder
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
