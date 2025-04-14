/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'lifeguardingacademy1.my.salesforce.com',
        },
      ],
    },
  };
  
  export default nextConfig;