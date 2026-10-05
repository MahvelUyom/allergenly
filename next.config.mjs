/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Linting is run separately in CI; don't block local builds on it.
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        // Never let dashboard/app/api surfaces get indexed.
        source: "/(dashboard|settings|menus|qr-codes|analytics)/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
