import { PublicKey } from "@solana/web3.js";
import { ICurve, ITokenBonding } from "@strata-foundation/spl-token-bonding";
import { useAccount, UseAccountState, useStrataSdks } from ".";

export function useCurve(
  curve: PublicKey | undefined
): UseAccountState<ICurve> {
  const { tokenBondingSdk } = useStrataSdks();

  return useAccount(curve, tokenBondingSdk?.curveDecoder, true);
}
