import { useState, useEffect, useMemo } from "react";
import { PublicKey } from "@solana/web3.js";
import { toMetadata, useStrataSdks, useWalletTokenAccounts } from "./";
import { ITokenWithMetaAndAccount } from "@strata-foundation/spl-token-collective";
import { useTokenList } from "./useTokenList";

export const useUserTokensWithMeta = (
  owner?: PublicKey
): {
  data: ITokenWithMetaAndAccount[];
  loading: boolean;
  error: Error | undefined;
} => {
  const { tokenCollectiveSdk } = useStrataSdks();
  const [data, setData] = useState<ITokenWithMetaAndAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();

  const {
    result: tokenAccounts,
    loading: loadingTokenAccounts,
    error: tokenAccountsError,
  } = useWalletTokenAccounts(owner);
  const tokenList = useTokenList();

  useEffect(() => {
    (async function () {
      if (owner && tokenAccounts) {
        try {
          setLoading(true);
          const tokenAccountsWithMeta =
            await tokenCollectiveSdk!.getUserTokensWithMeta(tokenAccounts);

          setData(tokenAccountsWithMeta);
        } catch (e: any) {
          setError(e);
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [owner, tokenAccounts, tokenCollectiveSdk, setData, setLoading, setError]);

  // Enrich with metadata from the token list
  const enriched = useMemo(
    () =>
      data.map((d) => {
        const enriched = toMetadata(
          tokenList && d.account && tokenList.get(d.account?.mint.toBase58())
        );
        return {
          ...d,
          image: d.image || enriched?.data.uri,
          metadata: d.metadata || enriched,
        };
      }),
    [data, tokenList]
  );

  return {
    data: enriched,
    loading: loading || loadingTokenAccounts,
    error: error || tokenAccountsError,
  };
};
