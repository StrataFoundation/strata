import { PublicKey } from "@solana/web3.js";
import { IFungibleParentEntangler } from "@strata-foundation/fungible-entangler";
import { UseAccountState, useAccount } from "./useAccount";
import { useStrataSdks } from "./useStrataSdks";

export function useFungibleParentEntangler(
  parentEntanglerKey: PublicKey | undefined | null,
): UseAccountState<IFungibleParentEntangler> & { error?: Error } {
  const { fungibleEntanglerSdk } = useStrataSdks();
  return useAccount(parentEntanglerKey, fungibleEntanglerSdk?.parentEntanglerDecoder);
}