import path from "path";
import "./bufferFill";
const rootDir = path.join(__dirname, "../../..");

require("dotenv").config({
  path: path.join(rootDir, ".env"),
});

export * from "./contexts";
export * from "./hooks";
