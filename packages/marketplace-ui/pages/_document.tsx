import { ColorModeScript } from "@chakra-ui/react";
import NextDocument, { Html, Head, Main, NextScript } from "next/document";
import { GA_TRACKING_ID, IS_PRODUCTION } from "../constants";

export default class Document extends NextDocument {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* enable analytics script only for production */}
          {IS_PRODUCTION && (
            <>
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
              />
              <script
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
                }}
              />
            </>
          )}
        </Head>
        <body>
          {/* 👇 Here's the script */}
          <ColorModeScript initialColorMode={"light"} />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
