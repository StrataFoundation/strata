import { PublicKey } from "@solana/web3.js";
import {
  useGovernance,
  useTokenBonding, useTokenMetadata,
  useTokenRef
} from "@strata-foundation/react";

export function useIsBountyAdmin(
  wallet: PublicKey | undefined,
  tokenBondingKey: PublicKey | undefined
): { loading: boolean; isAdmin: boolean, isEditor: boolean } {
  const { info: tokenBonding, loading: bondingLoading } =
    useTokenBonding(tokenBondingKey);
  const { info: governance, loading: governanceLoading } = useGovernance(
    tokenBonding?.reserveAuthority as PublicKey | undefined
  );

  const {
    metadata: targetMetadata,
    loading: targetMetaLoading,
  } = useTokenMetadata(tokenBonding?.targetMint);

  const { info: tokenRef, loading: tokenRefLoading } = useTokenRef(
    tokenBonding?.reserveAuthority as PublicKey | undefined
  );

  // Was an unclaimed social token that was the authority over this
  const isTokenRefAuthority =
    tokenRef && wallet && tokenRef.authority?.equals(wallet);
  return {
    loading:
      targetMetaLoading ||
      bondingLoading ||
      governanceLoading ||
      tokenRefLoading,
    isAdmin: Boolean(
      (wallet &&
        (tokenBonding?.reserveAuthority as PublicKey | undefined)?.equals(
          wallet
        )) ||
        governance ||
        isTokenRefAuthority
    ),
    isEditor: Boolean(
      targetMetadata?.updateAuthority &&
      targetMetadata.updateAuthority == wallet?.toBase58()
    ),
  };
}
