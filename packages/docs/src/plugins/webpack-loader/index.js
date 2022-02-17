const webpack = require("webpack");
const path = require("path")

module.exports = function(context, options) {
  return {
    name: "custom-webpack-plugin",
    
    configureWebpack(config, isServer, utils) {
      return {
        devtool: "source-map",
        node: {
          __dirname: true,
        },
        resolve: {
          fallback: {
            fs: false,
            os: require.resolve("os-browserify/browser"),
            path: require.resolve("path-browserify"),
            crypto: require.resolve("crypto-browserify"),
            stream: require.resolve("stream-browserify"),
          },
          alias: {
            "@chakra-ui/react": path.resolve(
              "../../node_modules/@chakra-ui/react"
            ),
            "@solana/wallet-adapter-react": path.resolve(
              "../../node_modules/@solana/wallet-adapter-react"
            ),
            "@toruslabs/solana-embed": path.resolve(
              "../../node_modules/@toruslabs/solana-embed"
            ),
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
          ],
        },
        plugins: [
          new webpack.ProvidePlugin({
            process: "process/browser",
          }),
        ],
      };
    }
  };
};
