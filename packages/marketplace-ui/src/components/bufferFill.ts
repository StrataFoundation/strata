import { Buffer } from "buffer";

// @ts-ignore
if (typeof window != "undefined") {
  //@ts-ignore
  window.Buffer = Buffer;
}
