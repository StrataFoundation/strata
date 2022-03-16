import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { useMint } from "./useMint";
import { useTokenBonding } from "./useTokenBonding";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import { useTokenBondingKey } from "./useTokenBondingKey";
import { useTokenAccount } from "./useTokenAccount";

/**
 * Use mint cap information for a token bonding curve to get information like the number of
 * items remaining
 */
export const useCapInfo = (tokenBondingKey: PublicKey | undefined, useTokenOfferingCurve: boolean = false) => {
  const { info: tokenBonding, loading: loadingBonding } =
    useTokenBonding(tokenBondingKey);
  const { result: sellOnlyTokenBondingKey, error: keyError1 } = useTokenBondingKey(tokenBonding?.targetMint, 1);
  if (keyError1) {
    console.error(keyError1);
  }
  const { info: sellOnlyTokenBonding, loading: sellOnlyLoading } = useTokenBonding(
    sellOnlyTokenBondingKey
  );
  const { info: supplyAcc } = useTokenAccount(sellOnlyTokenBonding?.baseStorage);
  const supplyMint = useMint(sellOnlyTokenBonding?.baseMint);
  const sellOnlySupply = supplyAcc && supplyMint && toNumber(supplyAcc.amount, supplyMint)

  const targetMintAcct = useMint(tokenBonding?.targetMint);
  const targetMintSupply =
     targetMintAcct && toNumber(targetMintAcct.supply, targetMintAcct);
  const mintCap: number | undefined =
    tokenBonding &&
    targetMintAcct &&
    (tokenBonding.mintCap as BN | undefined) &&
    toNumber(tokenBonding.mintCap as BN, targetMintAcct);
  const numRemaining =
    useTokenOfferingCurve ? sellOnlySupply :
    typeof targetMintSupply != "undefined" && !!mintCap
      ? mintCap - targetMintSupply
      : undefined;

  return {
    loading: loadingBonding || sellOnlyLoading,
    numRemaining,
    mintCap,
  };
};
