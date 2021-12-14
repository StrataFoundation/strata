import { PublicKey } from "@solana/web3.js";
import { ITokenRef } from "@strata-foundation/spl-token-collective";
import { useAccount, UseAccountState, useStrataSdks } from ".";

export function useTokenRef(
  tokenRef: PublicKey | undefined | null
): UseAccountState<ITokenRef> {
  const { tokenCollectiveSdk } = useStrataSdks();

  return useAccount(tokenRef, tokenCollectiveSdk?.tokenRefDecoder, true);
}
