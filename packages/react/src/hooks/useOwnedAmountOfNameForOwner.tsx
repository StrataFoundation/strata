import { PublicKey } from "@solana/web3.js";
import { useUserOwnedAmount } from "./bondingPricing";
import { useTokenRefForName } from "./tokenRef";

export function useOwnedAmountOfNameForOwner(
  owner: PublicKey | undefined | null,
  handle: string | undefined | null,
  collective: PublicKey | null,
  tld: PublicKey | undefined
): { amount: number | undefined; loading: boolean } {
  const { info: tokenRef, loading: loadingRef } = useTokenRefForName(
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
