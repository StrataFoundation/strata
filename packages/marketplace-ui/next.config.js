const path = require("path");
const withBundleAnalyzer = require("@next/bundle-analyzer");
const withPlugins = require("next-compose-plugins");

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: false,
  webpack5: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
    };
    config.module.rules = [
      ...config.module.rules,
      // ensure our libs barrel files don't constitute imports
      {
        test: /packages\/.*src\/index.ts/i,
        sideEffects: false,
      },
    ];
    config.resolve.alias = {
      ...config.resolve.alias,
      "@solana/wallet-adapter-react": path.resolve(
        "../../node_modules/@solana/wallet-adapter-react"
      ),
      "bn.js": path.resolve("../../node_modules/bn.js"),
      "@solana/web3.js": path.resolve("../../node_modules/@solana/web3.js"),
      borsh: path.resolve("../../node_modules/borsh"),
      buffer: path.resolve("../../node_modules/buffer"),
    };
    return config;
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/launchpad",
        permanent: false,
      },
      {
        source: "/lbcs/new",
        destination: "/launchpad/lbcs/new",
        permanent: false,
      },
    ];
  },
};

module.exports = withPlugins(
  [withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })],
  config
);
