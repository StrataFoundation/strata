import React, { FC, ReactNode, createContext } from "react";
import { PublicKey } from "@solana/web3.js";
import { useCoinGeckoPrice } from "../hooks/useCoinGeckoPrice";
import { useMarketPrice } from "../hooks/useMarketPrice";

export interface ISolPriceProviderProps {
  children: ReactNode;
}

export const SolPriceContext = createContext<number | undefined>(undefined);

const SOL_TO_USD_MARKET = new PublicKey(
  "9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT"
);

export const SolPriceProvider: FC<ISolPriceProviderProps> = ({ children }) => {
  const coinGeckoPrice = useCoinGeckoPrice();
  const marketPrice = useMarketPrice(SOL_TO_USD_MARKET);

  return (
    <SolPriceContext.Provider value={marketPrice || coinGeckoPrice}>
      {children}
    </SolPriceContext.Provider>
  );
};
