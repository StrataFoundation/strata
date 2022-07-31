import path from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import autoExternal from "rollup-plugin-auto-external";

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
    autoExternal()
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "MarketplaceSdk",
      formats: ["es", "umd"],
      fileName: (format) => `index.${format}.js`,
    },
  },
});
