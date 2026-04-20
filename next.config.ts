import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        hostname: "*",
      },
    ],
  },
  serverExternalPackages: ["knex"],
  // Add error handling for RSC payload issues
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Optimize production builds to prevent hydration issues
  ...(process.env.NODE_ENV === "production" && {
    compiler: {
      removeConsole: false, // Keep console logs for debugging
    },
  }),
  // Improve error handling
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
  /* config options here */
};

export default nextConfig;
