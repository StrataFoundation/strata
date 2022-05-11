import {
  AccountProvider,
  ErrorHandlerProvider,
  StrataSdksProvider,
  ThemeProvider,
} from "../contexts";
import React, { FC } from "react";

const defaultOnError = (error: Error) => console.log(error);
export const StrataProviders: FC<{ onError?: (error: Error) => void }> = ({
  children,
  onError = defaultOnError,
}) => (
  <ThemeProvider>
    <ErrorHandlerProvider onError={onError}>
      <StrataSdksProvider>
        <AccountProvider commitment="confirmed">{children}</AccountProvider>
      </StrataSdksProvider>
    </ErrorHandlerProvider>
  </ThemeProvider>
);
