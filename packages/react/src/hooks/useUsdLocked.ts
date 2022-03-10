import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { useBondingPricing } from "./bondingPricing";
import { usePriceInUsd } from "./usePriceInUsd";

export function useUsdLocked(
  tokenBondingKey: PublicKey | undefined
): number | undefined {
  const { pricing } = useBondingPricing(tokenBondingKey);

  const lowestMint = useMemo(() => {
    const arr = pricing?.hierarchy.toArray() || [];
    if (arr.length > 0) {
      return arr[arr.length - 1].tokenBonding.baseMint;
    }
  }, [pricing]);
  const fiatPrice = usePriceInUsd(lowestMint);
  const baseLocked = pricing?.locked(lowestMint);

  return fiatPrice && baseLocked && baseLocked * fiatPrice;
}
