import { HolaplexGraphqlProvider, StrataProviders } from "@strata-foundation/react";
import React, { FC } from "react";
import { MarketplaceSdkProvider } from "../contexts";

const defaultOnError = (error: Error) => console.log(error);
export const MarketplaceProviders: FC<React.PropsWithChildren<{
  onError?: (error: Error) => void;
  resetCSS?: boolean;
}>> = ({ children, onError = defaultOnError, resetCSS = false }) => (
  <StrataProviders onError={onError} resetCSS={resetCSS}>
    <MarketplaceSdkProvider>
      <HolaplexGraphqlProvider>{children}</HolaplexGraphqlProvider>
    </MarketplaceSdkProvider>
  </StrataProviders>
);
