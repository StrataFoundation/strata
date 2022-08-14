import { AnchorProvider } from "@project-serum/anchor";
import { MarketplaceSdk } from "@strata-foundation/marketplace-sdk";
import { useProvider } from "@strata-foundation/react";
import React, { useContext, useMemo } from "react";
import { useAsync } from "react-async-hook";

export const MarketplaceSdkContext = React.createContext<IMarketplaceSdkReactState>({
  loading: true,
});

export interface IMarketplaceSdkReactState {
  error?: Error;
  loading: boolean;
  marketplaceSdk?: MarketplaceSdk;
}

async function tryProm<A>(prom: Promise<A>): Promise<A | undefined> {
  try {
    return await prom;
  } catch (e) {
    console.error(e);
  }

  return undefined;
}

async function getSdk(
  provider: AnchorProvider | undefined | null
): Promise<MarketplaceSdk | undefined> {
  if (!provider) {
    console.warn(
      "No provider passed via ProviderContext to StrataSdkContext. Please provide a provider"
    );
    return undefined;
  }

  return tryProm(MarketplaceSdk.init(provider));
}

export const MarketplaceSdkProviderRaw: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { provider } = useProvider();
  const { result, loading, error } = useAsync(getSdk, [provider]);
  const sdks = useMemo(
    () => ({
      marketplaceSdk: result,
      error,
      loading,
    }),
    [result, loading, error]
  );

  return (
    <MarketplaceSdkContext.Provider value={sdks}>
      {children}
    </MarketplaceSdkContext.Provider>
  );
};

export const MarketplaceSdkProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <MarketplaceSdkProviderRaw>{children}</MarketplaceSdkProviderRaw>
  );
};

export const useMarketplaceSdk = (): IMarketplaceSdkReactState => {
  return useContext(MarketplaceSdkContext);
}
