import "../styles/globals.css";
import React, { FC, useEffect } from "react";
import "../utils/bufferFill";
import { DefaultSeo } from "next-seo";
import { AppProps } from "next/app";
import { useRouter } from "next/router";
import * as gtag from "../utils/gtag";
import { Toaster } from "react-hot-toast";

import SEO from "../next-seo.config";
import { Providers } from "../components/Providers";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { IS_PRODUCTION } from "../constants";

const App: FC<AppProps> = ({ Component, pageProps }) => {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: URL) => {
      /* invoke analytics function only for production */
      if (IS_PRODUCTION) gtag.pageview(url);
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  return (
    <Providers>
      <DefaultSeo {...SEO} />
      <Header />
      {/* @ts-ignore */}
      <Component {...pageProps} />
      <Toaster
        position="bottom-center"
        containerStyle={{
          margin: "auto",
          width: "420px",
        }}
      />
      <Footer />
    </Providers>
  );
};

export default App;
