import { PublicKey } from "@solana/web3.js";
import { 
  useTokenSwapFromFungibleEntangler, 
  ITokenSwap, 
  useTokenBondingFromMint,
  useTokenAccount,
  useMint,
} from "./";
import { toNumber } from "@strata-foundation/spl-token-bonding";


export function useTokenSwapFromId(
  id: PublicKey | undefined | null,
): ITokenSwap {

  // try and load a token bonding curve as if the id is a mint
  const { info: tokenBonding, loading: bondingLoading } = useTokenBondingFromMint(id, 0);
  const { info: supplyAcc } = useTokenAccount(
    tokenBonding?.baseStorage
  );
  const supplyMint = useMint(tokenBonding?.baseMint);

  // try and load the fungible entangler
  const entanglerTokenSwap = useTokenSwapFromFungibleEntangler(id);


  if (tokenBonding) {
    return {
      tokenBonding,
      numRemaining: supplyAcc && supplyMint && toNumber(supplyAcc?.amount, supplyMint),
      loading: bondingLoading,
    }
  }

  return entanglerTokenSwap;
}
