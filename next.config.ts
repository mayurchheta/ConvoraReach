import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Pin serverless functions to Mumbai (closest to DB at 72.60.101.180)
  serverExternalPackages: ["pg"],
};

export default nextConfig;
