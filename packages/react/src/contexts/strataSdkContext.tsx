import { useAsync } from "react-async-hook";
import { useProvider } from "../hooks/useProvider";

import { Provider } from "@project-serum/anchor";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import React from "react";
import { SplTokenMetadata } from "@strata-foundation/spl-utils";

export const StrataSdksContext = React.createContext<IStrataSdksReactState>({
  loading: true
})

export interface IStrataSdks {
  tokenBondingSdk?: SplTokenBonding;
  tokenCollectiveSdk?: SplTokenCollective;
  tokenMetdataSdk?: SplTokenMetadata;
};

export interface IStrataSdksReactState extends IStrataSdks {
  error?: Error;
  loading: boolean;
}


async function getSdks(provider: Provider | undefined): Promise<IStrataSdks> {
  if (!provider) {
    return {};
  }

  const tokenCollective = await SplTokenCollective.init(provider);
  const tokenBonding = await SplTokenBonding.init(provider);
  const splTokenMetdataSdk = await SplTokenMetadata.init(provider);
  return {
    tokenCollectiveSdk: tokenCollective,
    tokenBondingSdk: tokenBonding,
    tokenMetdataSdk: splTokenMetdataSdk
  };
}

export const StrataSdksProvider: React.FC = ({ children }) => {
  const provider = useProvider();
  const { result, loading, error } = useAsync(getSdks, [provider]);

  return <StrataSdksContext.Provider
    value={{
      tokenCollectiveSdk: result?.tokenCollectiveSdk,
      tokenBondingSdk: result?.tokenBondingSdk,
      error,
      loading
    }}
    >
      {children}
    </StrataSdksContext.Provider>
}
