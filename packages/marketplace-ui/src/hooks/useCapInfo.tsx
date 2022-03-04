import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { useMint, useTokenBonding } from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";

export const useCapInfo = (tokenBondingKey: PublicKey) => {
  const { info: tokenBonding, loading: loadingBonding } =
    useTokenBonding(tokenBondingKey);
  const targetMintAcct = useMint(tokenBonding?.targetMint);
  const targetMintSupply =
    targetMintAcct && toNumber(targetMintAcct.supply, targetMintAcct);
  const mintCap: number | undefined =
    tokenBonding &&
    targetMintAcct &&
    (tokenBonding.mintCap as BN | undefined) &&
    toNumber(tokenBonding.mintCap as BN, targetMintAcct);
  const numRemaining =
    typeof targetMintSupply != "undefined" && !!mintCap
      ? mintCap - targetMintSupply
      : undefined;

  return {
    loading: loadingBonding,
    numRemaining,
    mintCap
  }
};
