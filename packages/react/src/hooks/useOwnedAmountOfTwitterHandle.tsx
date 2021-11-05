import { PublicKey } from "@solana/web3.js";
import { useUserOwnedAmount } from "./bondingPricing";
import { useTwitterTokenRef } from "./tokenRef";

export function useOwnedAmountForOwnerAndHandle(
  owner: PublicKey | undefined,
  handle: string | undefined,
  collective: PublicKey | undefined,
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
