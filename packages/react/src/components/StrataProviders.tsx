import { TokenListProvider } from "../contexts/tokenList";
import { AccountProvider } from "../contexts/accountContext";
import { ErrorHandlerProvider } from "../contexts/errorHandlerContext";
import { StrataSdksProvider } from "../contexts/strataSdkContext";
import { ThemeProvider } from "../contexts/theme";
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
            <TokenListProvider>{children}</TokenListProvider>
          </StrataSdksProvider>
        </AccountProvider>
      </ProviderContextProvider>
    </ErrorHandlerProvider>
  </ThemeProvider>
);
