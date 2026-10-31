import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  agentRules: false,
  cacheComponents: true,
  serverExternalPackages: ["@libsql/client"],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
