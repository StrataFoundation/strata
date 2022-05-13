import {
  AccountProvider,
  ErrorHandlerProvider,
  StrataSdksProvider,
  ThemeProvider,
} from "../contexts";
import React, { FC } from "react";

const defaultOnError = (error: Error) => console.log(error);
export const StrataProviders: FC<{ onError?: (error: Error) => void, resetCSS?: boolean }> = ({
  children,
  onError = defaultOnError,
  resetCSS = false
}) => (
  <ThemeProvider resetCSS={resetCSS}>
    <ErrorHandlerProvider onError={onError}>
      <StrataSdksProvider>
        <AccountProvider commitment="confirmed">{children}</AccountProvider>
      </StrataSdksProvider>
    </ErrorHandlerProvider>
  </ThemeProvider>
);
