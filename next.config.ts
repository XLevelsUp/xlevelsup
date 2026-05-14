import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizeCss: true, // Inlines critical CSS and defers the rest
  },
};

export default nextConfig;
