import { useMemo } from "react";
import { useAsync } from "react-async-hook";
import { useConnection } from "@solana/wallet-adapter-react";

export const useRentExemptAmount = (
  size: number
): {
  loading: boolean;
  amount: number | undefined;
  error: Error | undefined;
} => {
  const { connection } = useConnection();
  const { loading, error, result } = useAsync<number, number[]>(
    connection.getMinimumBalanceForRentExemption.bind(connection),
    [size]
  );

  const amount = useMemo(() => (result || 0) / Math.pow(10, 9), [result]);

  return {
    amount,
    error,
    loading,
  };
};
