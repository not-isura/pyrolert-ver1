/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@/components/ui'],
  },
}

export default nextConfig;
