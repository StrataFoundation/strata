import path from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "SplTokenCollective",
      formats: ["es", "umd"],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "crypto",
        "@project-serum/anchor",
        "@project-serum/borsh",
        "@solana/web3.js",
        "assert",
        "base64-js",
        "bn.js",
        "bs58",
        "buffer",
        "camelcase",
        "eventemitter3",
        "js-sha256",
        "pako",
        "toml",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
});
