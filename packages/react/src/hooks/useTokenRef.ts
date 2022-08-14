import { PublicKey } from "@solana/web3.js";
import { ITokenRef } from "@strata-foundation/spl-token-collective";
import { UseAccountState, useAccount } from "./useAccount";
import { useStrataSdks } from "./useStrataSdks";

export function useTokenRef(
  tokenRef: PublicKey | undefined | null
): UseAccountState<ITokenRef> {
  const { tokenCollectiveSdk } = useStrataSdks();

  return useAccount(tokenRef, tokenCollectiveSdk?.tokenRefDecoder, true);
}
