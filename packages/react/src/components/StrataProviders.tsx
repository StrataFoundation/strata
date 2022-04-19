import {
  AccountProvider, ErrorHandlerProvider, StrataSdksProvider, ThemeProvider
} from "../contexts";
import React, { FC } from "react";

export const StrataProviders: FC = ({ children }) => (
  <ThemeProvider>
    <ErrorHandlerProvider>
        <StrataSdksProvider>
          <AccountProvider commitment="confirmed">{children}</AccountProvider>
        </StrataSdksProvider>
    </ErrorHandlerProvider>
  </ThemeProvider>
);
