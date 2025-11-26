import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't use static export since we have API routes
  // We'll deploy to Firebase Functions + Hosting
};

export default nextConfig;
