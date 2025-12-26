import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    eslint: {
        ignoreDuringBuilds: true,
    }, typscript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
