import "./bufferFill";
import { Wallet } from "../../contexts/Wallet";
import { MarketplaceSdkProvider } from "@strata-foundation/marketplace-ui";
import {
  AccountProvider,
  StrataSdksProvider,
  Notification,
  ErrorHandlerProvider,
  ProviderContextProvider,
  ThemeProvider,
  HolaplexGraphqlProvider,
  AcceleratorProvider,
} from "@strata-foundation/react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import React from "react";
import { VariablesProvider } from "./variables";
import toast, { Toaster } from "react-hot-toast";
import { ChatSdkProvider, EmojisProvider, ReplyProvider } from "@strata-foundation/chat-ui";

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");

export default ({ children }) => {
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
      } else if (code == "0x136") {
        error = new Error("Purchased more than the cap of 100 bWUM");
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
    <>
      <ThemeProvider>
        <ErrorHandlerProvider onError={onError}>
          <Wallet>
            <ProviderContextProvider>
              <WalletModalProvider>
                <AccountProvider commitment="confirmed">
                  <StrataSdksProvider>
                    <MarketplaceSdkProvider>
                      <ChatSdkProvider>
                        <HolaplexGraphqlProvider>
                          <EmojisProvider>
                            <ReplyProvider>
                              <AcceleratorProvider url="wss://prod-api.teamwumbo.com/accelerator">
                                <VariablesProvider>
                                  {children}
                                  <Toaster
                                    position="bottom-center"
                                    containerStyle={{
                                      margin: "auto",
                                      width: "420px",
                                    }}
                                  />
                                </VariablesProvider>
                              </AcceleratorProvider>
                            </ReplyProvider>
                          </EmojisProvider>
                        </HolaplexGraphqlProvider>
                      </ChatSdkProvider>
                    </MarketplaceSdkProvider>
                  </StrataSdksProvider>
                </AccountProvider>
              </WalletModalProvider>
            </ProviderContextProvider>
          </Wallet>
        </ErrorHandlerProvider>
      </ThemeProvider>
    </>
  );
};
