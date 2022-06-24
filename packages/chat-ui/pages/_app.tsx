import { Wallet } from "@/components/Wallet";
import { ChatSdkProvider } from "@/contexts/chatSdk";
import { EmojisProvider } from "@/contexts/emojis";
import { useMediaQuery } from "@chakra-ui/react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  AcceleratorProvider,
  Notification,
  StrataProviders,
  HolaplexGraphqlProvider,
} from "@strata-foundation/react";
import { AppProps } from "next/app";
import React from "react";
import toast, { Toaster } from "react-hot-toast";

require("@solana/wallet-adapter-react-ui/styles.css");

function MyApp({ Component, pageProps }: AppProps) {
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
    <Wallet>
      <WalletModalProvider>
        <StrataProviders resetCSS onError={onError}>
          <AcceleratorProvider url="wss://prod-api.teamwumbo.com/accelerator">
            <ChatSdkProvider>
              <HolaplexGraphqlProvider>
                <EmojisProvider>
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
                </EmojisProvider>
              </HolaplexGraphqlProvider>
            </ChatSdkProvider>
          </AcceleratorProvider>
        </StrataProviders>
      </WalletModalProvider>
    </Wallet>
  );
}

export default MyApp;
