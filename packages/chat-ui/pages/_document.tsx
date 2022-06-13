import React from "react";
import NextDocument, { Html, Head, Main, NextScript } from "next/document";
import { ColorModeScript } from "@chakra-ui/react";


export default class Document extends NextDocument {
  render() {
    return (
      <Html>
        <Head />
        <body style={{ width: "100vw", overflow: "hidden" }}>
          {/* Make Color mode to persists when you refresh the page. */}
          <ColorModeScript initialColorMode="dark" />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
