const path = require("path");

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: false,
  webpack5: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
    };
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
    });
    config.resolve.alias = {
      ...config.resolve.alias,
      "@solana/wallet-adapter-react": path.resolve(
        "../../node_modules/@solana/wallet-adapter-react"
      ),
      "@chakra-ui/react": path.resolve("../../node_modules/@chakra-ui/react"),
    };
    return config;
  },
  async redirects() {
    return [
      {
        source: "/docs/:path*",
        destination: `${process.env.NEXT_PUBLIC_DOCS_URL}/:path*`,
        permanent: false,
      },
      {
        source: "/blog/:path*",
        destination: `${process.env.NEXT_PUBLIC_BLOG_URL}/:path*`,
        permanent: false,
      },
      {
        source: "/riptide",
        destination: `${process.env.NEXT_PUBLIC_APP_URL}/lbcs/mint/CY3g38FGE4SaJA2xfLaKhmrRj9vRR69UE75niv6gqPJa`,
        permanent: false,
      },
    ];
  },
};
