import { PublicKey } from "@solana/web3.js";
import { WUMBO_TWITTER_TLD } from "../hooks";
import { useUserOwnedAmount } from "./bondingPricing";
import { useTwitterTokenRef } from "./tokenRef";

export function useOwnedAmountForOwnerAndHandle(
  owner: PublicKey | undefined | null,
  handle: string | undefined | null,
  collective?: PublicKey | undefined | null,
  tld: PublicKey = WUMBO_TWITTER_TLD
): { amount: number | undefined; loading: boolean } {
  const { info: tokenRef, loading: loadingRef } = useTwitterTokenRef(
    handle,
    collective,
    tld
  );
  const amount = useUserOwnedAmount(owner, tokenRef?.mint);

  return {
    loading: loadingRef,
    amount,
  };
}
