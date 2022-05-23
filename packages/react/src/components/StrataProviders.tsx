import {
  AccountProvider,
  ErrorHandlerProvider,
  StrataSdksProvider,
  ThemeProvider,
  TokenListProvider,
} from "../contexts";
import React, { FC } from "react";

const defaultOnError = (error: Error) => console.log(error);
export const StrataProviders: FC<{
  onError?: (error: Error) => void;
  resetCSS?: boolean;
}> = ({ children, onError = defaultOnError, resetCSS = false }) => (
  <ThemeProvider resetCSS={resetCSS}>
    <ErrorHandlerProvider onError={onError}>
      <StrataSdksProvider>
        <TokenListProvider>
          <AccountProvider commitment="confirmed">{children}</AccountProvider>
        </TokenListProvider>
      </StrataSdksProvider>
    </ErrorHandlerProvider>
  </ThemeProvider>
);
