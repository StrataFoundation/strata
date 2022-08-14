import { AppProps } from "next/app";
import { useRouter } from "next/router";
import { DefaultSeo } from "next-seo";
import { FC, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import "../src/components/bufferFill";
import { Header } from "../src/components/Header";
import { Footer } from "../src/components/Footer";
import { Providers } from "../src/components/Providers";
import { BrowserView, MobileView } from "react-device-detect";
import { IS_PRODUCTION } from "../src/constants";
import { pageview } from "../src/utils/gtag";
import SEO from "../next-seo.config";

// Use require instead of import since order matters
require("../styles/globals.css");
require("react-circular-progressbar/dist/styles.css");
require("@solana/wallet-adapter-react-ui/styles.css");

const App: FC<AppProps> = ({ Component, pageProps }) => {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: URL) => {
      /* invoke analytics function only for production */
      if (IS_PRODUCTION) pageview(url);
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
      <BrowserView>
        <Toaster
          position="bottom-left"
          containerStyle={{
            width: "420px",
          }}
        />
      </BrowserView>
      <MobileView>
        <Toaster
          position="bottom-center"
          containerStyle={{
            margin: "0 auto",
            width: "90%",
            maxWidth: "420px",
          }}
        />
      </MobileView>
      <Footer />
    </Providers>
  );
};

export default App;
