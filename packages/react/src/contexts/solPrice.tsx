import { useMarketPrice } from "../hooks";
import React from "react";
import { PublicKey } from "@solana/web3.js";

export const SolPriceContext = React.createContext<number | undefined>(
  undefined
);

const SOL_TO_USD_MARKET = new PublicKey(
  "9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT"
);

export const SolPriceProvider: React.FC = ({ children }) => {
  const price = useMarketPrice(SOL_TO_USD_MARKET);
  return (
    <SolPriceContext.Provider value={price}>
      {children}
    </SolPriceContext.Provider>
  );
};
