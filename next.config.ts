/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Prevent ESLint errors from failing the production build:
    ignoreDuringBuilds: true
  }
};
export default nextConfig;
