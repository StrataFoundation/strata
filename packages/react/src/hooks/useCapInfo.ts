import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { useMint } from "./useMint";
import { useTokenBonding } from "./useTokenBonding";
import { toNumber } from "@strata-foundation/spl-token-bonding";

/**
 * Use mint cap information for a token bonding curve to get information like the number of
 * items remaining
 */
export const useCapInfo = (tokenBondingKey: PublicKey | undefined) => {
  const { info: tokenBonding, loading: loadingBonding } =
    useTokenBonding(tokenBondingKey);
  const targetMintAcct = useMint(tokenBonding?.targetMint);
  const targetMintSupplyU64 = tokenBonding?.ignoreExternalSupplyChanges ? tokenBonding.supplyFromBonding : targetMintAcct?.supply;
  const targetMintSupply =
    targetMintAcct && toNumber(targetMintSupplyU64, targetMintAcct);
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
    mintCap,
  };
};
