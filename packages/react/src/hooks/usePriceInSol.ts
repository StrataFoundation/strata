import { PublicKey } from "@solana/web3.js";
import { useSolPrice } from "./useSolPrice";
import { useBondingPricingFromMint } from "./bondingPricing";
import { NATIVE_MINT } from "@solana/spl-token";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { useEffect, useState } from "react";

export function usePriceInSol(
  token: PublicKey | undefined | null
): number | undefined {
  const solPrice = useSolPrice();
  const { pricing, tokenBonding } = useBondingPricingFromMint(token);

  const [price, setPrice] = useState<number>();

  useEffect(() => {
    if (
      token?.equals(NATIVE_MINT) ||
      token?.equals(SplTokenBonding.WRAPPED_SOL_MINT)
    ) {
      setPrice(1);
    } else if (pricing) {
      try {
        console.log(pricing?.current(SplTokenBonding.WRAPPED_SOL_MINT));
        setPrice(pricing?.current(SplTokenBonding.WRAPPED_SOL_MINT));
      } catch (e) {
        console.warn(`Token ${token} cannot be priced in terms of SOL`);
      }
    }
  }, [token, solPrice, pricing, tokenBonding]);

  return price;
}
