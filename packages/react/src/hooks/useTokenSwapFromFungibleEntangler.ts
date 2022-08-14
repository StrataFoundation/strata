import { PublicKey } from "@solana/web3.js";
import { IFungibleChildEntangler, IFungibleParentEntangler } from "@strata-foundation/fungible-entangler";
import {
  ITokenBonding,
  toNumber
} from "@strata-foundation/spl-token-bonding";
import { useFungibleChildEntangler } from "./useFungibleChildEntangler";
import { useFungibleParentEntangler } from "./useFungibleParentEntangler";
import { useMint } from "./useMint";
import { useTokenAccount } from "./useTokenAccount";
import { useTokenBondingFromMint } from "./useTokenBondingFromMint";


export interface ITokenSwap {
  tokenBonding: ITokenBonding | undefined;
  numRemaining: number | undefined;
  retrievalTokenBonding?: ITokenBonding;

  childEntangler?: IFungibleChildEntangler;
  parentEntangler?: IFungibleParentEntangler;

  loading: boolean;
}
export function useTokenSwapFromFungibleEntangler (
  id: PublicKey | undefined | null,
): ITokenSwap {

  // load the fungible entangler
  const { info: childEntangler, loading: loading1 } = useFungibleChildEntangler(id);
  const { info: parentEntangler, loading: loading2 } = useFungibleParentEntangler(childEntangler?.parentEntangler);
  const { info: tokenBonding, loading: loading3 } = useTokenBondingFromMint(childEntangler?.childMint, 0);

  // load to find the amount remaining in the fungible entangler
  const { info: supplyAcc } = useTokenAccount(
    parentEntangler?.parentStorage
  );
  const supplyMint = useMint(parentEntangler?.parentMint);

  return {
    tokenBonding,
    numRemaining: supplyAcc && supplyMint && toNumber(supplyAcc?.amount, supplyMint),
    childEntangler: childEntangler,
    parentEntangler: parentEntangler,
    loading: loading1 || loading2 || loading3
  }
}
