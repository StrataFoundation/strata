import { PublicKey } from "@solana/web3.js";
import { useBondingPricing, useInterval, useSolanaUnixTime } from "@strata-foundation/react";
import { useEffect, useState } from "react";

export function useLivePrice(tokenBondingKey: PublicKey | undefined) {
  const { pricing, loading } =
    useBondingPricing(tokenBondingKey);

  const [currentPrice, setCurrentPrice] = useState<number | undefined>();
  const unixTime = useSolanaUnixTime();
  useEffect(() => {
    if (pricing) {
      setCurrentPrice(
        pricing.current(pricing.hierarchy.tokenBonding.baseMint, unixTime)
      );
    }
  }, [unixTime, pricing]);
  
  return {
    loading,
    price: currentPrice,
  };
}
