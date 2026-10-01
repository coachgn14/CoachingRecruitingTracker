import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Coach proof-of-employment uploads are capped at 8 MB (see src/lib/storage.ts).
      bodySizeLimit: "9mb",
    },
  },
};

export default nextConfig;
