import { PublicKey } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import { ITokenSwap, useTokenSwapFromFungibleEntangler } from "./useTokenSwapFromFungibleEntangler";
import { useMint } from "./useMint";
import { useTokenBondingFromMint } from "./useTokenBondingFromMint";


export function useTokenSwapFromId(
  id: PublicKey | undefined | null,
): ITokenSwap {

  // try and load a token bonding curve as if the id is a mint
  const { info: tokenBonding, loading: bondingLoading } = useTokenBondingFromMint(id, 0);
  const targetMintAcct = useMint(tokenBonding?.targetMint);

  // try and load the fungible entangler
  const entanglerTokenSwap = useTokenSwapFromFungibleEntangler(id);

  // try and load a second bonding curve (legacy support)
  const { info: sellOnlyTokenBonding, loading: sellBondingLoading } = useTokenBondingFromMint(id, 1);

  if (tokenBonding) {
    const targetMintSupply = targetMintAcct && toNumber(targetMintAcct.supply, targetMintAcct);
    const mintCap = tokenBonding && targetMintAcct &&
      (tokenBonding.mintCap as BN | undefined) &&
      toNumber(tokenBonding.mintCap as BN, targetMintAcct);
    const numRemaining = typeof targetMintSupply != "undefined" && !!mintCap
        ? mintCap - targetMintSupply
        : undefined;
    return {
      tokenBonding,
      retrievalTokenBonding: sellOnlyTokenBonding,
      numRemaining,
      loading: bondingLoading || sellBondingLoading,
    }
  }

  return entanglerTokenSwap;
}
