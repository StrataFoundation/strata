import { Buffer } from "buffer";

if (typeof window !== "undefined") {
  window.Buffer = Buffer;
} else {
  global.Buffer = Buffer;
}
