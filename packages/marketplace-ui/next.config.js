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
