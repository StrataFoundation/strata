import { PublicKey } from "@solana/web3.js";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { useMemo } from "react";
import { useAsync, UseAsyncReturn } from "react-async-hook";

async function tokenBondingKey(mintKey: PublicKey | undefined, index: number) {
  return mintKey
    ? (await SplTokenBonding.tokenBondingKey(mintKey, index))[0]
    : undefined;
}

export function useTokenBondingKey(
  mintKey: PublicKey | undefined,
  index: number
): UseAsyncReturn<PublicKey | undefined> {
  const uniqueMintKey = useMemo(() => mintKey, [mintKey?.toBase58()])
  return useAsync(tokenBondingKey, [uniqueMintKey, index]);
}
