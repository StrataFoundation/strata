import { PublicKey } from "@solana/web3.js";
import { useSolPrice } from "./useSolPrice";
import { useBondingPricingFromMint } from "./bondingPricing";
import { NATIVE_MINT } from "@solana/spl-token";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { useEffect, useMemo, useState } from "react";
import { useTwWrappedSolMint } from "./useTwWrappedSolMint";
import { useMetaplexTokenMetadata } from "./useMetaplexMetadata";
import { getCoinGeckoPriceUsd } from "./useCoinGeckoPrice";

export function usePriceInSol(
  token: PublicKey | undefined | null
): number | undefined {
  const solPrice = useSolPrice();
  const { pricing, tokenBonding, loading: pricingLoading } = useBondingPricingFromMint(token);
  const lowestMint = useMemo(() => {
    const arr = pricing?.hierarchy.toArray() || [];
    if (arr.length > 0) {
      return arr[arr.length - 1].tokenBonding.baseMint;
    }
  }, [pricing]);
  const { metadata, loading } = useMetaplexTokenMetadata(lowestMint);
  const { metadata: inputMeta } = useMetaplexTokenMetadata(token);

  const [price, setPrice] = useState<number>();

  const wrappedSolMint = useTwWrappedSolMint();
  useEffect(() => {
    if (
      token?.equals(NATIVE_MINT) ||
      (wrappedSolMint && token?.equals(wrappedSolMint))
    ) {
      setPrice(1);
    } else if (pricing) {
      if (wrappedSolMint) {
        const currentPricing = pricing?.current(lowestMint);
        if (wrappedSolMint && lowestMint?.equals(wrappedSolMint)) {
          setPrice(currentPricing);
        } else if (wrappedSolMint && !loading && solPrice) {
          getCoinGeckoPriceUsd(metadata?.data.name)
            ?.then((p) => {
              if (p) {
                const newPrice = (p * currentPricing) / solPrice;
                setPrice(newPrice);
              }
            })
            .catch(console.error);
        }
      }
    }
  }, [token, solPrice, pricing, tokenBonding, loading, wrappedSolMint]);

  useEffect(() => {
    if (!pricing && !pricingLoading && inputMeta && solPrice) {
      getCoinGeckoPriceUsd(inputMeta?.data.name)
        ?.then((p) => {
          if (p) {
            const newPrice = p / solPrice;
            setPrice(newPrice);
          }
        })
        .catch(console.error);
    }
  }, [inputMeta, pricingLoading, pricing, solPrice]);

  return price;
}
