import { PublicKey } from "@solana/web3.js";
import {
  ITokenBonding,
  toNumber,
} from "@strata-foundation/spl-token-bonding";
import { IFungibleChildEntangler, IFungibleParentEntangler } from "@strata-foundation/fungible-entangler";
import { useAsync } from "react-async-hook";
import { 
  useTokenBondingFromMint,
  useFungibleChildEntangler,
  useFungibleParentEntangler,
  useTokenAccount,
  useMint,
} from "./";

export interface ITokenSwap {
  tokenBonding: ITokenBonding | undefined;
  numRemaining: number | undefined;

  childEntangler?: IFungibleChildEntangler;
  parentEntangler?: IFungibleParentEntangler;
}
export function useTokenSwapFromFungibleEntangler (
  id: PublicKey | undefined | null,
): ITokenSwap {

  // load the fungible entangler
  const { info: childEntangler } = useFungibleChildEntangler(id);
  const { info: parentEntangler } = useFungibleParentEntangler(childEntangler?.parentEntangler);
  const { info: tokenBonding } = useTokenBondingFromMint(childEntangler?.childMint, 0);

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
  }
}
