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
      "@chakra-ui/react": path.resolve(
        "../../node_modules/@chakra-ui/react"
      ),
      "@chakra-ui/color-mode": path.resolve(
        "../../node_modules/@chakra-ui/color-mode"
      ),
      "react-hot-toast": path.resolve(
        "../../node_modules/react-hot-toast"
      ),
    };
    return config;
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/bounties",
        permanent: false,
      },
    ];
  },
};
