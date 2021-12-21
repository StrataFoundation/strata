import { PublicKey } from "@solana/web3.js";
import { useSolPrice } from "./useSolPrice";
import { useBondingPricingFromMint } from "./bondingPricing";
import { NATIVE_MINT } from "@solana/spl-token";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { useEffect, useState } from "react";
import { useTwWrappedSolMint } from "./useTwWrappedSolMint";

export function usePriceInSol(
  token: PublicKey | undefined | null
): number | undefined {
  const solPrice = useSolPrice();
  const { pricing, tokenBonding } = useBondingPricingFromMint(token);

  const [price, setPrice] = useState<number>();

  const wrappedSolMint = useTwWrappedSolMint();
  useEffect(() => {
    if (
      token?.equals(NATIVE_MINT) ||
      (wrappedSolMint && token?.equals(wrappedSolMint))
    ) {
      setPrice(1);
    } else if (pricing) {
      try {
        setPrice(wrappedSolMint && pricing?.current(wrappedSolMint));
      } catch (e) {
        console.warn(`Token ${token} cannot be priced in terms of SOL`);
      }
    }
  }, [token, solPrice, pricing, tokenBonding]);

  return price;
}
