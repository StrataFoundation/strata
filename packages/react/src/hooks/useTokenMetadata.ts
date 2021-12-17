import { NATIVE_MINT } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { ITokenWithMetaAndAccount } from "@strata-foundation/spl-token-collective";
import {
  Data,
  decodeMetadata,
  Edition,
  getMetadata,
  MasterEditionV1,
  MasterEditionV2,
  Metadata,
  SplTokenMetadata,
} from "@strata-foundation/spl-utils";
import { useAsync } from "react-async-hook";
import { useMintTokenRef, usePublicKey, useStrataSdks } from ".";
import { useAccount } from "./useAccount";
import { useAssociatedAccount } from "./useAssociatedAccount";
import { useMint } from "./useMint";
import { useTwWrappedSolMint } from "./useTwWrappedSolMint";

export interface IUseTokenMetadataResult extends ITokenWithMetaAndAccount {
  loading: boolean;
  error: Error | undefined;
}

const parser = (_: any, acct: any) => decodeMetadata(acct.data);
const solMetadata = new Metadata({
  updateAuthority: "",
  mint: NATIVE_MINT.toBase58(),
  data: new Data({
    name: "Solana",
    symbol: "SOL",
    uri: "https://strata-token-metadata.s3.us-east-2.amazonaws.com/sol.json",
    creators: null,
    sellerFeeBasisPoints: 0,
  }),
  primarySaleHappened: false,
  isMutable: false,
  editionNonce: null,
});

/**
 * Get the token account and all metaplex + token collective metadata around the token
 *
 * @param token
 * @returns
 */
export function useTokenMetadata(
  token: PublicKey | undefined | null
): IUseTokenMetadataResult {
  const {
    result: metadataAccountKeyStr,
    loading,
    error,
  } = useAsync(
    async (token: string | undefined | null) =>
      token ? getMetadata(token) : undefined,
    [token?.toBase58()]
  );
  const metadataAccountKey = usePublicKey(metadataAccountKeyStr);

  let { info: metadata, loading: accountLoading } = useAccount(
    metadataAccountKey,
    parser
  );
  
  const wrappedSolMint = useTwWrappedSolMint();
  const isSol =
    token?.equals(NATIVE_MINT) ||
    (wrappedSolMint && token?.equals(wrappedSolMint));
  if (isSol) {
    metadata = solMetadata;
  }

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

  const { info: mintTokenRef } = useMintTokenRef(token);
  return {
    tokenRef: mintTokenRef,
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
