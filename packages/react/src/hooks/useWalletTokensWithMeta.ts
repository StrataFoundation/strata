import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { ITokenWithMetaAndAccount } from "@strata-foundation/spl-token-collective";
import { useAsync, UseAsyncReturn } from "react-async-hook";
import { useStrataSdks } from "./useStrataSdks";
import { useWalletTokenAccounts } from "./useWalletTokenAccounts";

/**
 * @deprecated The method should not be used. It fetches way too much data. Consider fetching only the data
 * you need in the components you need. If each component fetches data around a token, you can display a loading
 * mask for each individual component
 * 
 * Get all tokens in a wallet plus all relevant metadata from spl-token-metadata and spl-token-collective
 *
 * @param owner
 * @returns
 */
export function useWalletTokensWithMeta(
  owner?: PublicKey
): UseAsyncReturn<ITokenWithMetaAndAccount[]> {
  const { connection } = useConnection();
  const { result: tokenAccounts, error } = useWalletTokenAccounts(owner);
  const { tokenCollectiveSdk, loading } = useStrataSdks();
  const getTokensWithMeta = tokenCollectiveSdk
    ? tokenCollectiveSdk.getUserTokensWithMeta
    : () => Promise.resolve([]);

  const asyncResult = useAsync(getTokensWithMeta, [connection, tokenAccounts]);
  return {
    ...asyncResult,
    loading: loading || asyncResult.loading,
    error: asyncResult.error || error,
  };
}
