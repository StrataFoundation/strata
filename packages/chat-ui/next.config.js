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
    return config;
  },
};

module.exports = withPlugins(
  [
    withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" }),
  ],
  config
);
