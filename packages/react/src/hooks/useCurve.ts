import { PublicKey } from "@solana/web3.js";
import { ICurve } from "@strata-foundation/spl-token-bonding";
import { useAccount, UseAccountState } from "./useAccount";
import { useStrataSdks } from "./useStrataSdks";

export function useCurve(
  curve: PublicKey | undefined | null
): UseAccountState<ICurve> {
  const { tokenBondingSdk } = useStrataSdks();

  return useAccount(curve, tokenBondingSdk?.curveDecoder, true);
}
