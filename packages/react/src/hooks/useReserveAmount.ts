import { PublicKey } from "@solana/web3.js";
import { amountAsNum } from "@strata-foundation/spl-token-bonding";
import { useMemo } from "react";
import { useMint } from "./useMint";
import { useTokenAccount } from "./useTokenAccount";
import { useTokenBonding } from "./useTokenBonding";

export function useReserveAmount(tokenBonding?: PublicKey | undefined): number | undefined {
  const { info: tokenBondingAcc } = useTokenBonding(tokenBonding);
  const { info: reserves } = useTokenAccount(tokenBondingAcc?.baseStorage);
  const baseMint = useMint(tokenBondingAcc?.baseMint);
  const reserveAmount = useMemo(
    () => reserves && baseMint && amountAsNum(reserves.amount, baseMint),
    [reserves]
  );

  return reserveAmount
}
