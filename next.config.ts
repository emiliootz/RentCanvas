import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from external sources used for tenant/lease document uploads
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com", // If you later add S3 for uploads
      },
    ],
  },
};

export default nextConfig;
