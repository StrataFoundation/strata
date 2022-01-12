import { PublicKey } from "@solana/web3.js";
import { ICollective } from "@strata-foundation/spl-token-collective";
import { useAccount, UseAccountState, useStrataSdks } from ".";

export function useCollective(
  collective: PublicKey | undefined | null
): UseAccountState<ICollective> {
  const { tokenCollectiveSdk } = useStrataSdks();

  return useAccount(collective, tokenCollectiveSdk?.collectiveDecoder, false);
}
