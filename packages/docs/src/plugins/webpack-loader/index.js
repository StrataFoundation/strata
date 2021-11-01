const webpack = require("webpack");

module.exports = function(context, options) {
  return {
    name: "custom-webpack-plugin",
    configureWebpack(config, isServer, utils) {
      return {
        resolve: {
          fallback: {
            "fs": false,
            "os": require.resolve("os-browserify/browser"),
            "path": require.resolve("path-browserify"),
            "crypto": require.resolve("crypto-browserify"),
            "stream": require.resolve("stream-browserify") 
          },
        },
        module: {
          rules: [{
            test: /.js$/,
            type: "javascript/auto",
            resolve: {
              fullySpecified: false
            }
          }]
        },
        plugins: [
          new webpack.ProvidePlugin({
            process: 'process/browser',
          }),
        ]
      };
    }
  };
};
