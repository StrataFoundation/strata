import React, { FC, ReactNode, createContext } from "react";
import { useMarketPrice } from "../hooks";
import { PublicKey } from "@solana/web3.js";

export interface ISolPriceProviderProps {
  children: ReactNode;
}

export const SolPriceContext = createContext<number | undefined>(undefined);

const SOL_TO_USD_MARKET = new PublicKey(
  "9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT"
);

export const SolPriceProvider: FC<ISolPriceProviderProps> = ({ children }) => {
  const price = useMarketPrice(SOL_TO_USD_MARKET);
  return (
    <SolPriceContext.Provider value={price}>
      {children}
    </SolPriceContext.Provider>
  );
};
