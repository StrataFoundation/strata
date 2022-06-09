import { PublicKey } from "@solana/web3.js";
import { IFungibleChildEntangler } from "@strata-foundation/fungible-entangler";
import { UseAccountState, useStrataSdks, useAccount } from "./";

export function useFungibleChildEntangler(
  childEntanglerKey: PublicKey | undefined | null,
): UseAccountState<IFungibleChildEntangler | undefined> & { error?: Error } {
  const { fungibleEntanglerSdk } = useStrataSdks();
  return useAccount(childEntanglerKey, fungibleEntanglerSdk?.childEntanglerDecoder);
}