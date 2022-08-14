import React, { FC } from "react";
import {
  ChakraProvider, CSSReset
} from "@chakra-ui/react";
import { theme } from "@strata-foundation/react";

export const ThemeProvider: FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <ChakraProvider resetCSS theme={theme}>
    {/* @ts-ignore */}
    {children}
  </ChakraProvider>
);
