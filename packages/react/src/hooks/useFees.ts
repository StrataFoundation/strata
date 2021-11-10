import { useMemo } from "react";
import { useAsync } from "react-async-hook";
import { useConnection } from "@solana/wallet-adapter-react";
import { getFeesPerSignature } from "@strata-foundation/spl-utils";

export const useFees = (
  signatures: number
): {
  loading: boolean;
  amount: number | undefined;
  error: Error | undefined;
} => {
  const { connection } = useConnection();
  const { loading, error, result } = useAsync(getFeesPerSignature, [
    connection,
  ]);

  const amount = useMemo(
    () => ((result || 0) * signatures) / Math.pow(10, 9),
    [result, signatures]
  );

  return {
    amount,
    error,
    loading,
  };
};
