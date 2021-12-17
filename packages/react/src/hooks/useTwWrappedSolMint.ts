import { PublicKey } from "@solana/web3.js"
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { useAsync } from "react-async-hook";
import { useStrataSdks } from "./useStrataSdks";

async function getWrappedSol(tokenBondingSdk: SplTokenBonding | undefined): Promise<PublicKey | undefined> {
  if (!tokenBondingSdk) {
    return
  }

  return (await tokenBondingSdk.getState())?.wrappedSolMint
}

export function useTwWrappedSolMint(): PublicKey | undefined {
  const { tokenBondingSdk } = useStrataSdks();
  const { result: wrappedSolMint, error } = useAsync(getWrappedSol, [tokenBondingSdk])

  if (error) {
    console.error(error);
  }

  return wrappedSolMint
}