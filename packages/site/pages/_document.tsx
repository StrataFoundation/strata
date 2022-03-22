import Document, { Html, Head, Main, NextScript } from "next/document";
import { DefaultSeo } from "next-seo";
import SEO from "../next-seo.config";
import { GA_TRACKING_ID, IS_PRODUCTION } from "@/constants";

export default class MyDocument extends Document {
  render(): JSX.Element {
    return (
      <Html>
        <Head>
          <DefaultSeo {...SEO} />
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
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
