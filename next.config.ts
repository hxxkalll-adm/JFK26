import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ['100.99.188.31', 'diamond-clarke-national-integrating.trycloudflare.com'],
    },
  },
  // @ts-ignore - allowedDevOrigins is a valid option in recent Next.js versions for HMR support over tunnels/IPs
  allowedDevOrigins: ['100.99.188.31'],
};

export default nextConfig;
