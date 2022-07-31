import {
  AccountProvider,
  ErrorHandlerProvider,
  StrataSdksProvider,
  ThemeProvider,
  TokenListProvider,
} from "../contexts";
import React, { FC } from "react";
import { ProviderContextProvider } from "../contexts/providerContext";

const defaultOnError = (error: Error) => console.log(error);
export const StrataProviders: FC<{
  onError?: (error: Error) => void;
  resetCSS?: boolean;
  tokenList?: boolean;
}> = ({
  children,
  tokenList = true,
  onError = defaultOnError,
  resetCSS = false,
}) => (
  <ThemeProvider resetCSS={resetCSS}>
    <ErrorHandlerProvider onError={onError}>
      <ProviderContextProvider>
        <AccountProvider commitment="confirmed">
          <StrataSdksProvider>
            {tokenList && <TokenListProvider>{children}</TokenListProvider>}
            {children}
          </StrataSdksProvider>
        </AccountProvider>
      </ProviderContextProvider>
    </ErrorHandlerProvider>
  </ThemeProvider>
);
