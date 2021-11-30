import { useState, useEffect } from "react";
import {
  PublicKey,
  RpcResponseAndContext,
  TokenAccountBalancePair,
} from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";

export const useLargestTokenAccounts = (
  tokenMint: PublicKey | undefined | null
): {
  loading: boolean;
  result: RpcResponseAndContext<TokenAccountBalancePair[]> | undefined;
  error: Error | undefined;
} => {
  const { connection } = useConnection();
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<
    RpcResponseAndContext<TokenAccountBalancePair[]> | undefined
  >();
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    (async () => {
      if (tokenMint) {
        setLoading(true);
        try {
          const result = await connection.getTokenLargestAccounts(tokenMint);
          setResult(result);
        } catch (e: any) {
          setError(e);
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [tokenMint]);

  return { loading, result, error };
};
