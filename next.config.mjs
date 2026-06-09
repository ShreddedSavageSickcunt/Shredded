/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow rendering photos served from Supabase Storage.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
