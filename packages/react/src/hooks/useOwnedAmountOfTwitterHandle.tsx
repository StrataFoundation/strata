import { PublicKey } from "@solana/web3.js";
import { useUserOwnedAmount } from "./bondingPricing";
import { useTwitterTokenRef } from "./tokenRef";

export function useOwnedAmountForOwnerAndHandle(
  owner: PublicKey | undefined | null,
  handle: string | undefined | null,
  collective: PublicKey | undefined | null,
  tld?: PublicKey
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
