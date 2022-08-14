import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { ChatSdkProvider, EmojisProvider, ReplyProvider } from "@strata-foundation/chat-ui";
import { MarketplaceSdkProvider } from "@strata-foundation/marketplace-ui";
import {
  AcceleratorProvider, AccountProvider, ErrorHandlerProvider, GraphqlProvider, Notification, ProviderContextProvider, StrataSdksProvider, ThemeProvider
} from "@strata-foundation/react";
import React from "react";
import toast, { Toaster } from "react-hot-toast";
import { Wallet } from "../../contexts/Wallet";
import "./bufferFill";
import { VariablesProvider } from "./variables";

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");

export default ({ children }: {children: any}) => {
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
          {/* @ts-ignore */}
          <Wallet>
            <ProviderContextProvider>
              <WalletModalProvider>
                <AccountProvider commitment="confirmed">
                  <StrataSdksProvider>
                    <MarketplaceSdkProvider>
                      {/* @ts-ignore */}
                      <ChatSdkProvider>
                        <GraphqlProvider>
                          <EmojisProvider>
                            <ReplyProvider>
                              <AcceleratorProvider url="wss://prod-api.teamwumbo.com/accelerator">
                                {/* @ts-ignore */}
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
                        </GraphqlProvider>
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
