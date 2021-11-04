import { useAsync } from "react-async-hook";
import { useProvider } from "../hooks/useProvider";

import { Provider } from "@project-serum/anchor";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import React from "react";

export const StrataSdksContext = React.createContext<IStrataSdksReactState>({
  loading: true
})

export interface IStrataSdks {
  tokenBondingSdk?: SplTokenBonding;
  tokenCollectiveSdk?: SplTokenCollective;
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
  return {
    tokenCollectiveSdk: tokenCollective,
    tokenBondingSdk: tokenBonding,
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
