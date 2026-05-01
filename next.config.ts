import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        // Static assets — long cache, no interference needed
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // All page/API routes — prevent shared proxies from caching RSC payloads
        // and serving them to regular HTML requests
        source: "/((?!_next/static).*)",
        headers: [
          {
            // private: CDN/shared proxy must not store this response
            // no-cache: browser must revalidate before using any cached copy
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
          {
            // Tell proxies that respect Vary to keep separate copies per RSC header
            key: "Vary",
            value: "RSC, Next-Router-State-Tree, Next-Router-Prefetch",
          },
        ],
      },
    ];
  },
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
