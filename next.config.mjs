/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["*.app.github.dev"],
    },
  },
};

export default nextConfig;

  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "*.github.dev",
        "*.vercel.app"
      ]
  },
}

};

export default nextConfig
