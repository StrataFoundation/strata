import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import replace from "@rollup/plugin-replace";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import autoExternal from "rollup-plugin-auto-external";
import json from "@rollup/plugin-json";

const env = process.env.NODE_ENV;

export default {
  input: "src/index.ts",
  plugins: [
    json(),
    commonjs(),
    nodeResolve({
      browser: true,
      extensions: [".js", ".ts"],
      dedupe: ["bn.js", "buffer", "borsh", "@solana/web3.js"],
      preferBuiltins: false,
    }),
    typescript({
      tsconfig: "./tsconfig-build.json",
      declaration: true,
      outDir: "dist",
    }),
    autoExternal(),
    replace({
      preventAssignment: true,
      values: {
        "process.env.NODE_ENV": JSON.stringify(env),
        "process.env.ANCHOR_BROWSER": JSON.stringify(true),
      },
    }),
    terser(),
  ],
  external: [
    "@hookform/resolvers/yup",
    "next/app",
    "next/router",
    "next/document",
    "next/head",
    "react-icons",
    "react",
    "react-dom",
    "react/jsx-runtime",
    "react-icons/ri",
    "react-icons/ai",
    "react-icons/bs",
    "react-icons/io",
    "react-icons/md",
    "react-icons/fa",
    "react-icons/bi",
    "react-icons/fi",
    "react-icons/io5",
    "react-icons/lib",
    "lodash/throttle",
    "lodash/debounce",
  ],
  output: [
    {
      dir: "dist",
      format: "esm",
      sourcemap: true,
      preserveModulesRoot: "src",
      preserveModules: true,
    },
    {
      name: "ChatUI",
      file: "dist/index.umd.js",
      format: "umd",
      sourcemap: true,
    },
  ],
};
