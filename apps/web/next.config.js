/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ashenhost/database', '@ashenhost/shared-types'],
  reactStrictMode: true,
};

module.exports = nextConfig;
