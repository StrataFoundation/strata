import { Notification } from "@strata-foundation/react";
import { ChatProviders } from "../src/components/ChatProviders";
import { Wallet } from "../src/components/Wallet";
import { IS_PRODUCTION } from "../src/constants/globals";
import { useMediaQuery } from "@chakra-ui/react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { AppProps } from "next/app";
import { useRouter } from "next/router";
import Head from "next/head";
import { DefaultSeo } from "next-seo";
import React, { useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { pageview } from "../src/utils/gtag";
import SEO from "../next-seo.config";

require("./app.css");
require("@solana/wallet-adapter-react-ui/styles.css");

function MyApp({ Component, pageProps }: AppProps) {
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

  const onError = React.useCallback(
    (error: Error) => {
      console.error(error);
      if (
        error.message?.includes(
          "Attempt to debit an account but found no record of a prior credit."
        )
      ) {
        error = new Error("Not enough SOL to perform this action");
      }

      const code = (error.message?.match("custom program error: (.*)") ||
        [])[1];
      if (code == "0x1") {
        error = new Error("Insufficient balance.");
      } else if (code === "0x0") {
        error = new Error("Blockhash expired. Please retry");
      }

      toast.custom((t) => (
        <Notification
          type="error"
          show={t.visible}
          heading={error.name}
          // @ts-ignore
          message={error.message || error.msg || error.toString()}
          onDismiss={() => toast.dismiss(t.id)}
        />
      ));
    },
    [toast]
  );
  const [isMobile] = useMediaQuery("(max-width: 680px)");

  return (
    <>
      <DefaultSeo {...SEO} />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
      </Head>
      <Wallet>
        <WalletModalProvider>
          <ChatProviders onError={onError}>
            <Component {...pageProps} />
            {isMobile ? (
              <Toaster
                position="top-center"
                containerStyle={{
                  margin: "60px auto",
                  width: "90%",
                  maxWidth: "420px",
                }}
              />
            ) : (
              <Toaster
                position="bottom-left"
                containerStyle={{
                  width: "420px",
                }}
              />
            )}
          </ChatProviders>
        </WalletModalProvider>
      </Wallet>
    </>
  );
}

export default MyApp;
