import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { ITokenWithMetaAndAccount } from "@strata-foundation/spl-token-collective";
import { useStrataSdks } from ".";
import { useAsync, UseAsyncReturn } from "react-async-hook";
import { useWalletTokenAccounts } from "./useWalletTokenAccounts";

/**
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
