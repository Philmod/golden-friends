import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow serving images from the data folder
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
