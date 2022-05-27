import { AppProps } from "next/app";
import React from "react";
import toast, { Toaster } from "react-hot-toast";
import { Wallet } from "@/components/Wallet";
import { Notification, StrataProviders } from "@strata-foundation/react";
import { ChatSdkProvider } from "@/contexts/chatSdk";
import { BrowserView, MobileView } from "react-device-detect";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

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
  return (
    <Wallet>
      <WalletModalProvider>
        <StrataProviders resetCSS onError={onError}>
          <ChatSdkProvider>
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
          </ChatSdkProvider>
        </StrataProviders>
      </WalletModalProvider>
    </Wallet>
  );
}

export default MyApp;
