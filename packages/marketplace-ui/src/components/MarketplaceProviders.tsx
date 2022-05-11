import { StrataProviders } from "@strata-foundation/react";
import React, { FC } from "react";
import { MarketplaceSdkProvider } from "../contexts";
import { HolaplexGraphqlProvider } from "./HolaplexGraphqlProvider";

const defaultOnError = (error: Error) => console.log(error);
export const MarketplaceProviders: FC<{ onError?: (error: Error) => void }> = ({
  children,
  onError = defaultOnError,
}) => (
  <StrataProviders onError={onError}>
    <MarketplaceSdkProvider>
      <HolaplexGraphqlProvider>{children}</HolaplexGraphqlProvider>
    </MarketplaceSdkProvider>
  </StrataProviders>
);
