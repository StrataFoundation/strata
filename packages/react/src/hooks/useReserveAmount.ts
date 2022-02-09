import { PublicKey } from "@solana/web3.js";
import { amountAsNum } from "@strata-foundation/spl-token-bonding";
import { useMemo } from "react";
import { useMint } from "./useMint";
import { useTokenAccount } from "./useTokenAccount";
import { useTokenBonding } from "./useTokenBonding";

export function useReserveAmount(tokenBonding?: PublicKey | undefined): number | undefined {
  const { info: tokenBondingAcc, loading: loadingBonding } = useTokenBonding(tokenBonding);
  const { info: reserves, loading: loadingToken } = useTokenAccount(
    tokenBondingAcc?.baseStorage
  );
  const baseMint = useMint(tokenBondingAcc?.baseMint);
  const loading = useMemo(() => loadingBonding || loadingToken, [loadingBonding, loadingToken]);
  const reserveAmount = useMemo(
    () =>
      !reserves && !loading
        ? 0
        : reserves && baseMint && amountAsNum(reserves.amount, baseMint),
    [reserves, baseMint, loading]
  );

  return reserveAmount
}
