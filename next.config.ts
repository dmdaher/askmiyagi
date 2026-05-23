import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required by PostHog reverse-proxy: PostHog's ingest endpoints use
  // trailing slashes (e.g. /e/) and Next.js would otherwise redirect them,
  // breaking event capture.
  skipTrailingSlashRedirect: true,

  async redirects() {
    return [
      {
        source: '/admin/pipeline/:path*',
        destination: '/admin/:path*',
        permanent: true,
      },
    ];
  },

  async rewrites() {
    return [
      // PostHog reverse-proxy (US region). Path "/relay-mg" is intentionally
      // non-obvious to dodge ad-blocker keyword filters — keep it that way.
      {
        source: '/relay-mg/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/relay-mg/array/:path*',
        destination: 'https://us-assets.i.posthog.com/array/:path*',
      },
      {
        source: '/relay-mg/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },
};

export default nextConfig;
