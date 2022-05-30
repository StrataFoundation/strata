import React from "react";
import NextDocument, { Html, Head, Main, NextScript } from "next/document";
import { ColorModeScript } from "@chakra-ui/react";

// Default dark mode
if (typeof localStorage !== "undefined") {
  if (!localStorage.getItem("chakra-ui-color-mode")) {
    localStorage.setItem("chakra-ui-color-mode", "dark");
  }
}

export default class Document extends NextDocument {
  render() {
    return (
      <Html>
        <Head />
        <body>
          {/* Make Color mode to persists when you refresh the page. */}
          <ColorModeScript />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
