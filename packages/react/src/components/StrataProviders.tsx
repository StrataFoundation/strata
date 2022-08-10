import React, { FC } from "react";
import { AccountProvider } from "../contexts/accountContext";
import { ErrorHandlerProvider } from "../contexts/errorHandlerContext";
import { ProviderContextProvider } from "../contexts/providerContext";
import { StrataSdksProvider } from "../contexts/strataSdkContext";
import { ThemeProvider } from "../contexts/theme";

const defaultOnError = (error: Error) => console.log(error);
export const StrataProviders: FC<React.PropsWithChildren<{
  onError?: (error: Error) => void;
  resetCSS?: boolean;
}>> = ({
  children,
  onError = defaultOnError,
  resetCSS = false,
}) => (
  <ThemeProvider resetCSS={resetCSS}>
    <ErrorHandlerProvider onError={onError}>
      <ProviderContextProvider>
        <AccountProvider commitment="confirmed">
          <StrataSdksProvider>
            {children}
          </StrataSdksProvider>
        </AccountProvider>
      </ProviderContextProvider>
    </ErrorHandlerProvider>
  </ThemeProvider>
);
