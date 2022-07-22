import { PublicKey } from "@solana/web3.js";
import { IUseMetaplexTokenMetadataResult, useMetaplexTokenMetadata } from ".";

export interface IUseTokenAuthoritiesResult extends IUseMetaplexTokenMetadataResult {
  hasMintAuth: boolean;
  hasUpdateAuth: boolean;
  hasFreezeAuth: boolean;
  hasAnyAuth: boolean;
}

/**
 * Get all metaplex metadata around a token and information about whether the public key holds any authorities
 *
 * @param token
 * @returns
 */
export function useTokenAuthorities(
  mint: PublicKey | undefined | null,
  wallet: PublicKey | undefined,
): IUseTokenAuthoritiesResult {
  const allMetadata = useMetaplexTokenMetadata(mint);

  const hasUpdateAuth = !!(wallet && allMetadata.metadata?.updateAuthority == wallet?.toString());
  const hasMintAuth = !!(wallet && allMetadata.mint?.mintAuthority && allMetadata.mint?.mintAuthority.equals(wallet));
  const hasFreezeAuth = !!(wallet && allMetadata.mint?.freezeAuthority && allMetadata.mint?.freezeAuthority.equals(wallet));

  return {
    ...allMetadata,
    hasUpdateAuth,
    hasMintAuth,
    hasFreezeAuth,
    hasAnyAuth: hasUpdateAuth || hasMintAuth || hasFreezeAuth,
  };
}
