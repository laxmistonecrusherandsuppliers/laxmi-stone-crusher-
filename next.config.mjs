/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdfkit', 'pg'],
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
