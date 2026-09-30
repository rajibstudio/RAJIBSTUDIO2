import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1080, 1440, 1920],
  },
  // Tree-shake heavy libraries more aggressively.
  experimental: {
    optimizePackageImports: ["@react-three/drei", "gsap"],
  },
};

export default nextConfig;
