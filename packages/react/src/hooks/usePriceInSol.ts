import { NATIVE_MINT } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { useBondedTokenPrice } from "./useBondedTokenPrice";
import { useJupiterPrice } from "./useJupiterPrice";

export function usePriceInSol(
  token: PublicKey | undefined | null
): number | undefined {
  const bondedTokenPrice = useBondedTokenPrice(token || undefined, NATIVE_MINT);
  const tokenPriceJup = useJupiterPrice(token || undefined, NATIVE_MINT);

  return useMemo(() => bondedTokenPrice || tokenPriceJup, [bondedTokenPrice, tokenPriceJup])
}
