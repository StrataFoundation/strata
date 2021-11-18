import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { ITokenWithMetaAndAccount } from "@strata-foundation/spl-token-collective";
import {
  decodeMetadata,
  Edition,
  getMetadata,
  MasterEditionV1,
  MasterEditionV2,
  Metadata,
  SplTokenMetadata,
} from "@strata-foundation/spl-utils";
import { usePublicKey, useStrataSdks } from ".";
import { useAsync } from "react-async-hook";
import { useClaimedTokenRef } from "./tokenRef";
import { useAccount } from "./useAccount";
import { useAssociatedAccount } from "./useAssociatedAccount";
import { useMint } from "./useMint";

export interface IUseTokenMetadataResult extends ITokenWithMetaAndAccount {
  loading: boolean;
  error: Error | undefined;
}

const parser = (_: any, acct: any) => decodeMetadata(acct.data);

/**
 * Get the token account and all metaplex + token collective metadata around the token
 *
 * @param token
 * @returns
 */
export function useTokenMetadata(
  token: PublicKey | undefined
): IUseTokenMetadataResult {
  const {
    result: metadataAccountKeyStr,
    loading,
    error,
  } = useAsync(
    async (token: string | undefined) =>
      token ? getMetadata(token) : undefined,
    [token?.toBase58()]
  );
  const metadataAccountKey = usePublicKey(metadataAccountKeyStr);

  const { info: metadata, loading: accountLoading } = useAccount(
    metadataAccountKey,
    parser
  );

  const { tokenMetadataSdk: splTokenMetadataSdk } = useStrataSdks();
  const getEditionInfo: (metadata: Metadata | undefined) => Promise<{
    edition?: Edition;
    masterEdition?: MasterEditionV1 | MasterEditionV2;
  }> = splTokenMetadataSdk
    ? splTokenMetadataSdk.getEditionInfo
    : () => Promise.resolve({});
  const { result: editionInfo } = useAsync(
    async (metadata: Metadata | undefined) =>
      (await getEditionInfo(metadata)) || [],
    [metadata]
  );

  const wallet = useWallet();
  const { associatedAccount } = useAssociatedAccount(wallet.publicKey, token);
  const {
    result: data,
    loading: dataLoading,
    error: dataError,
  } = useAsync(SplTokenMetadata.getArweaveMetadata, [metadata?.data.uri]);
  const {
    result: image,
    loading: imageLoading,
    error: imageError,
  } = useAsync(SplTokenMetadata.getImage, [metadata?.data.uri]);
  const mint = useMint(token);

  const { info: tokenRef } = useClaimedTokenRef(wallet.publicKey || undefined);
  return {
    tokenRef,
    loading: Boolean(
      token && (loading || accountLoading || dataLoading || imageLoading)
    ),
    error: error || dataError || imageError,
    mint,
    metadata,
    metadataKey: metadataAccountKey,
    data,
    image: image,
    account: associatedAccount,
    description: data?.description,
    publicKey: metadataAccountKey,
    ...editionInfo,
  };
}
