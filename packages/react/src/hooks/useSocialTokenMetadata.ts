import { PublicKey } from "@solana/web3.js";
import { ITokenBonding } from "@strata-foundation/spl-token-bonding";
import { ITokenRef } from "@strata-foundation/spl-token-collective";
import { usePrimaryClaimedTokenRef } from "./tokenRef";
import { useTokenBonding } from "./useTokenBonding";
import { IUseTokenMetadataResult, useTokenMetadata } from "./useTokenMetadata";
import { useTokenRef } from "./useTokenRef";

export interface IUseSocialTokenMetadataResult extends IUseTokenMetadataResult {
  tokenBonding?: ITokenBonding;
  tokenRef?: ITokenRef;
}


/**
 * Get all metadata associated with a given wallet's social token.
 *
 * @param ownerOrTokenRef
 * @returns
 */
export function useSocialTokenMetadata(
  ownerOrTokenRef: PublicKey | undefined | null
): IUseSocialTokenMetadataResult {
  const { info: tokenRef1, loading: loading1 } =
    usePrimaryClaimedTokenRef(ownerOrTokenRef);
  const { info: tokenRef2, loading: loading2 } = useTokenRef(ownerOrTokenRef);
  const tokenRef = tokenRef1 || tokenRef2;
  const { info: tokenBonding, loading: loading3 } = useTokenBonding(
    tokenRef?.tokenBonding || undefined
  );

  return {
    ...useTokenMetadata(tokenBonding?.targetMint),
    tokenRef,
    tokenBonding,
    loading: loading1 || loading2 || loading3,
  };
}
