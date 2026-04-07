import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/admin/pipeline/:path*',
        destination: '/admin/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
