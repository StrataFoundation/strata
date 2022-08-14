import { PublicKey } from "@solana/web3.js";
import { ITokenBonding } from "@strata-foundation/spl-token-bonding";
import { useAccount, UseAccountState } from "./useAccount";
import { useStrataSdks } from "./useStrataSdks";

export const useTokenBonding = (
  tokenBonding: PublicKey | undefined | null
): UseAccountState<ITokenBonding> => {
  const { tokenBondingSdk } = useStrataSdks();

  return useAccount(tokenBonding, tokenBondingSdk?.tokenBondingDecoder);
};
