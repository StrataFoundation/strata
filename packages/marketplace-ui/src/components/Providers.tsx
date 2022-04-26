import { CSSReset } from "@chakra-ui/css-reset";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  AccountProvider,
  ErrorHandlerProvider,
  Notification,
  StrataSdksProvider,
  TokenListProvider,
} from "@strata-foundation/react";
import { ThemeProvider } from "./ThemeProvider";
import { MarketplaceSdkProvider } from "../contexts/marketplaceSdkContext";
import React from "react";
import toast from "react-hot-toast";
import { DEFAULT_ENDPOINT, Wallet } from "./Wallet";
import { ApolloProvider, InMemoryCache, ApolloClient } from "@apollo/client";

const client = new ApolloClient({
  uri: "http://graph.holaplex.com/v1",
  cache: new InMemoryCache({
    resultCaching: false,
  }),
});

export const Providers = ({
  children,
  cluster,
}: {
  cluster?: string;
  children: React.ReactNode;
}) => {
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
    <ThemeProvider>
      <ApolloProvider client={client}>
        <ErrorHandlerProvider onError={onError}>
          <Wallet cluster={cluster}>
            <WalletModalProvider>
              <StrataSdksProvider>
                <AccountProvider commitment="confirmed">
                  <TokenListProvider>
                    <MarketplaceSdkProvider>{children}</MarketplaceSdkProvider>
                  </TokenListProvider>
                </AccountProvider>
              </StrataSdksProvider>
            </WalletModalProvider>
          </Wallet>
        </ErrorHandlerProvider>
      </ApolloProvider>
    </ThemeProvider>
  );
};
