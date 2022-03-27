import { PublicKey } from "@solana/web3.js";
import { useBondingPricing, useInterval } from "@strata-foundation/react";
import { useState } from "react";

export function useLivePrice(tokenBondingKey: PublicKey | undefined) {
  const { pricing, loading } =
    useBondingPricing(tokenBondingKey);

  const [currentPrice, setCurrentPrice] = useState<number | undefined>();
  useInterval(() => {
    if (pricing) {
      setCurrentPrice(pricing.current());
    }
  }, 500);
  
  return {
    loading,
    price: currentPrice,
  };
}
