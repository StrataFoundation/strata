import { PublicKey } from "@solana/web3.js";
import {
  ITokenBonding,
  SplTokenBonding,
} from "@strata-foundation/spl-token-bonding";
import { useAsync } from "react-async-hook";
import { UseAccountState } from "./useAccount";
import { useTokenBonding } from "./useTokenBonding";

export function useTokenBondingFromMint(
  mint: PublicKey | undefined | null,
  index?: number
): UseAccountState<ITokenBonding> & { error?: Error } {
  const {
    result: key,
    loading,
    error,
  } = useAsync(
    async (mint: PublicKey | undefined | null, index: number) =>
      mint && SplTokenBonding.tokenBondingKey(mint, index),
    [mint, index || 0]
  );

  const tokenBondingInfo = useTokenBonding(key && key[0]);

  return {
    ...tokenBondingInfo,
    loading: tokenBondingInfo.loading || loading,
    error,
  };
}
