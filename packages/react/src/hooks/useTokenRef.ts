import { PublicKey } from "@solana/web3.js";
import { ITokenRef } from "@strata-foundation/spl-token-collective";
import { useAccount, UseAccountState, useStrataSdks } from ".";

export function useTokenRef(
  tokenBonding: PublicKey | undefined
): UseAccountState<ITokenRef> {
  const { tokenCollectiveSdk } = useStrataSdks();

  return useAccount(tokenBonding, tokenCollectiveSdk?.tokenRefDecoder, true);
}
