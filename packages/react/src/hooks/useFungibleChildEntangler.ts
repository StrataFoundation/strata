import { PublicKey } from "@solana/web3.js";
import { IFungibleChildEntangler } from "@strata-foundation/fungible-entangler";
import { UseAccountState, useAccount } from "./useAccount";
import { useStrataSdks } from "./useStrataSdks";

export function useFungibleChildEntangler(
  childEntanglerKey: PublicKey | undefined | null,
): UseAccountState<IFungibleChildEntangler | undefined> & { error?: Error } {
  const { fungibleEntanglerSdk } = useStrataSdks();
  return useAccount(childEntanglerKey, fungibleEntanglerSdk?.childEntanglerDecoder);
}
