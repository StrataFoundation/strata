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
      "@chakra-ui/color-mode": path.resolve(
        "../../node_modules/@chakra-ui/color-mode"
      ),
      "react-hot-toast": path.resolve("../../node_modules/react-hot-toast"),
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
  async headers() {
    // Allow cors in development mode so we can run local getToken requests
    // from docs
    if (process.env.NODE_ENV === "development") {
      return [
        {
          // matching all API routes
          source: "/api/:path*",
          headers: [
            { key: "Access-Control-Allow-Credentials", value: "true" },
            { key: "Access-Control-Allow-Origin", value: "*" },
            {
              key: "Access-Control-Allow-Methods",
              value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
            },
            {
              key: "Access-Control-Allow-Headers",
              value:
                "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
            },
          ],
        },
      ];
    }

    return []
  },
};
