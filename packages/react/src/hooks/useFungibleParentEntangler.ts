import { PublicKey } from "@solana/web3.js";
import { IFungibleParentEntangler } from "@strata-foundation/fungible-entangler";
import { UseAccountState, useStrataSdks, useAccount } from "./";

export function useFungibleParentEntangler(
  parentEntanglerKey: PublicKey | undefined | null,
): UseAccountState<IFungibleParentEntangler> & { error?: Error } {
  const { fungibleEntanglerSdk } = useStrataSdks();
  return useAccount(parentEntanglerKey, fungibleEntanglerSdk?.parentEntanglerDecoder);
}