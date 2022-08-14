const webpack = require("webpack");
const path = require("path");
const Dotenv = require("dotenv-webpack");

module.exports = function (context, options) {
  return {
    name: "custom-webpack-plugin",

    configureWebpack(config, isServer, utils) {
      return {
        devtool: "source-map",
        node: {
          __dirname: true,
        },
        stats: 'verbose',
        resolve: {
          fallback: {
            fs: false,
            os: require.resolve("os-browserify/browser"),
            path: require.resolve("path-browserify"),
            crypto: require.resolve("crypto-browserify"),
            stream: require.resolve("stream-browserify"),
            http: require.resolve("stream-http"),
            https: require.resolve("https-browserify"),
          },
          alias: {
            "@solana/wallet-adapter-react": path.resolve(
              "../../node_modules/@solana/wallet-adapter-react"
            ),
            "bn.js": path.resolve("../../node_modules/bn.js"),
            "@solana/web3.js": path.resolve(
              "../../node_modules/@solana/web3.js"
            ),
            borsh: path.resolve("../../node_modules/borsh"),
            buffer: path.resolve("../../node_modules/buffer"),
          },
        },
        module: {
          rules: [
            {
              test: /.js$/,
              type: "javascript/auto",
              resolve: {
                fullySpecified: false,
              },
            },
            // ensure our libs barrel files don't constitute imports
            {
              test: /packages\/.*src\/index.ts/i,
              sideEffects: false,
            },
          ],
        },
        plugins: [
          new Dotenv(),
          new webpack.ProvidePlugin({
            process: "process/browser",
          }),
        ],
      };
    },
  };
};
