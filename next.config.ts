import type { NextConfig } from "next";
import sizes from "./src/lib/image-sizes.json";

const nextConfig: NextConfig = {
  // Fully static site (./out) so it can be hosted on GitHub Pages or any static host.
  output: "export",
  trailingSlash: true,
  // "/RAJIBSTUDIO2" on GitHub Pages (set by the deploy workflow), empty locally or on a custom domain.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  reactStrictMode: true,
  images: {
    loader: "custom",
    loaderFile: "./src/lib/imageLoader.ts",
    deviceSizes: sizes.deviceSizes,
    imageSizes: sizes.imageSizes,
  },
  // Tree-shake heavy libraries more aggressively.
  experimental: {
    optimizePackageImports: ["@react-three/drei", "gsap"],
  },
};

export default nextConfig;
