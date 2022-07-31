import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { ITokenWithMetaAndAccount } from "@strata-foundation/spl-token-collective";
import { useMintTokenRef } from "./tokenRef";
import { useAssociatedAccount } from "./useAssociatedAccount";
import { useMetaplexTokenMetadata } from "./useMetaplexMetadata";

export interface IUseTokenMetadataResult extends ITokenWithMetaAndAccount {
  loading: boolean;
  error: Error | undefined;
}

/**
 * Get the token account and all metaplex + token collective metadata around the token
 *
 * @param token
 * @returns
 */
export function useTokenMetadata(
  token: PublicKey | undefined | null
): IUseTokenMetadataResult {
  const metaplexData = useMetaplexTokenMetadata(token);

  const wallet = useWallet();
  const { associatedAccount } = useAssociatedAccount(wallet.publicKey, token);
  const { info: mintTokenRef, loading: loadingTokenRef } =
    useMintTokenRef(token);

  return {
    ...metaplexData,
    tokenRef: mintTokenRef,
    loading: Boolean(token && (loadingTokenRef || metaplexData.loading)),
    account: associatedAccount,
  };
}
