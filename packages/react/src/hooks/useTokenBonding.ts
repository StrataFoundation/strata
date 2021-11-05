import { PublicKey } from "@solana/web3.js"
import { ITokenBonding } from "@strata-foundation/spl-token-bonding"
import { useAccount, UseAccountState, useStrataSdks } from "."

export function useTokenBonding(tokenBonding: PublicKey | undefined): UseAccountState<ITokenBonding> {
  const { tokenBondingSdk } = useStrataSdks();

  return useAccount(tokenBonding, tokenBondingSdk?.tokenBondingDecoder);
}
