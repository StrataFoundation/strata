import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { ITokenWithMetaAndAccount } from "@strata-foundation/spl-token-collective";
import { useMemo } from "react";
import { useUserTokensWithMeta } from "./useUserTokensWithMeta";

export function useCollectionOwnedAmount(collection: PublicKey | undefined): {
  matches: ITokenWithMetaAndAccount[] | undefined;
  amount?: number;
  loading: boolean;
  error?: Error;
} {
  const { publicKey } = useWallet();
  const {
    data: tokens,
    loading,
    error,
  } = useUserTokensWithMeta(publicKey || undefined);
  const matches = useMemo(() => {
    if (tokens) {
      return tokens.filter((token) => {
        const nftCollection = token.metadata?.collection;
        return (
          collection &&
          nftCollection &&
          nftCollection.key == collection.toBase58()
        );
      }, 0);
    }
  }, [tokens, collection?.toBase58()]);

  const amount = useMemo(() => {
    if (matches) {
      return matches.reduce((acc, nft) => {
        return acc + 1;
      }, 0);
    }
  }, [matches]);

  return {
    error,
    loading,
    matches,
    amount,
  };
}
