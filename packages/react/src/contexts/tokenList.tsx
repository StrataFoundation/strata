import { TokenListProvider as Provider, TokenInfo, ENV } from "@solana/spl-token-registry";
import React, { useEffect, useState } from "react";

export const TokenListContext = React.createContext<
  Map<string, TokenInfo> | undefined
>(undefined);

export const TokenListProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [tokenMap, setTokenMap] = useState<Map<string, TokenInfo>>(new Map());

  useEffect(() => {
    new Provider().resolve().then((tokens) => {
      const tokenList = tokens.filterByChainId(ENV.MainnetBeta).getList();

      setTokenMap(
        tokenList.reduce((map, item) => {
          map.set(item.address, item);
          return map;
        }, new Map())
      );
    });
  }, [setTokenMap]);

  return <TokenListContext.Provider value={tokenMap}>
    { children }
  </TokenListContext.Provider>
}
