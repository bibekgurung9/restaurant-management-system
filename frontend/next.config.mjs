/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['res.cloudinary.com'],
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL}/:path*`,
      },
    ];
  },
}

export default nextConfig