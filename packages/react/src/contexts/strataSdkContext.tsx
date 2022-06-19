import { Provider } from "@project-serum/anchor";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import { SplTokenMetadata } from "@strata-foundation/spl-utils";
import React, { useMemo } from "react";
import { useAsync } from "react-async-hook";
import { useProvider } from "../hooks/useProvider";
import { ProviderContextProvider } from "./providerContext";

export const StrataSdksContext = React.createContext<IStrataSdksReactState>({
  loading: true,
});

export interface IStrataSdks {
  tokenBondingSdk?: SplTokenBonding;
  tokenCollectiveSdk?: SplTokenCollective;
  tokenMetadataSdk?: SplTokenMetadata;
}

export interface IStrataSdksReactState extends IStrataSdks {
  error?: Error;
  loading: boolean;
}

async function tryProm<A>(prom: Promise<A>): Promise<A | undefined> {
  try {
    return await prom;
  } catch (e) {
    console.error(e);
  }

  return undefined;
}

async function getSdks(
  provider: Provider | undefined | null
): Promise<IStrataSdks> {
  if (!provider) {
    return {};
  }

  const [
    tokenCollective,
    tokenBonding,
    splTokenMetadataSdk
  ] = (await tryProm(Promise.all([
    SplTokenCollective.init(provider),
    SplTokenBonding.init(provider),
    SplTokenMetadata.init(provider)
  ])) || []);
  return {
    tokenCollectiveSdk: tokenCollective,
    tokenBondingSdk: tokenBonding,
    tokenMetadataSdk: splTokenMetadataSdk,
  };
}

export const StrataSdksProvider: React.FC = ({ children }) => {
  const { provider } = useProvider();
  const { result, loading, error } = useAsync(getSdks, [provider]);
  const sdks = useMemo(
    () => ({
      tokenCollectiveSdk: result?.tokenCollectiveSdk,
      tokenBondingSdk: result?.tokenBondingSdk,
      tokenMetadataSdk: result?.tokenMetadataSdk,
      error,
      loading,
    }),
    [result, loading, error, provider]
  );

  return (
    <StrataSdksContext.Provider value={sdks}>
      {children}
    </StrataSdksContext.Provider>
  );
};