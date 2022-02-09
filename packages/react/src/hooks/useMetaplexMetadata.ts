import {
  DataV2,
  EditionData,
  MasterEditionData,
  Metadata,
  MetadataData,
} from "@metaplex-foundation/mpl-token-metadata";
import { NATIVE_MINT } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { ITokenWithMeta, SplTokenMetadata } from "@strata-foundation/spl-utils";
import { useAsync } from "react-async-hook";
import { useStrataSdks } from ".";
import { useAccount } from "./useAccount";
import { useMint } from "./useMint";
import { useTwWrappedSolMint } from "./useTwWrappedSolMint";

export interface IUseMetaplexTokenMetadataResult extends ITokenWithMeta {
  loading: boolean;
  error: Error | undefined;
}

const parser = (key: any, acct: any) => acct && new Metadata(key, acct).data;
const solMetadata = new MetadataData({
  updateAuthority: "",
  mint: NATIVE_MINT.toBase58(),
  data: new DataV2({
    name: "Solana",
    symbol: "SOL",
    uri: "https://strata-token-metadata.s3.us-east-2.amazonaws.com/sol.json",
    creators: null,
    sellerFeeBasisPoints: 0,
    collection: null,
    uses: null,
  }),
  primarySaleHappened: false,
  isMutable: false,
  editionNonce: null,
});

/**
 * Get the token account and all metaplex metadata around the token
 *
 * @param token
 * @returns
 */
export function useMetaplexTokenMetadata(
  token: PublicKey | undefined | null
): IUseMetaplexTokenMetadataResult {
  const {
    result: metadataAccountKey,
    loading,
    error,
  } = useAsync(
    async (token: string | undefined | null) =>
      token ? Metadata.getPDA(token) : undefined,
    [token?.toBase58()]
  );

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
  const getEditionInfo: (metadata: MetadataData | undefined) => Promise<{
    edition?: EditionData;
    masterEdition?: MasterEditionData;
  }> = splTokenMetadataSdk
    ? splTokenMetadataSdk.getEditionInfo
    : () => Promise.resolve({});
  const { result: editionInfo } = useAsync(
    async (metadata: MetadataData | undefined) =>
      (await getEditionInfo(metadata)) || [],
    [metadata]
  );

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

  const isLoading =
    loading ||
    accountLoading ||
    dataLoading ||
    imageLoading;
    
  return {
    loading: isLoading,
    error: error || dataError || imageError,
    mint,
    metadata,
    metadataKey: metadataAccountKey,
    data,
    image: image,
    description: data?.description,
    ...editionInfo,
  };
}
