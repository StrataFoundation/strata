import { useFees } from "./useFees";
import { useRentExemptAmount } from "./useRentExemptAmount";

export const useEstimatedFees = (
  size: number,
  signatures: number
): {
  loading: boolean;
  amount: number | undefined;
  error: Error | undefined;
} => {
  const { loading, error, amount: fees } = useFees(signatures);
  const {
    loading: rentLoading,
    error: rentError,
    amount: rent,
  } = useRentExemptAmount(size);

  return {
    amount: fees && rent ? fees + rent : undefined,
    error: error || rentError,
    loading: loading || rentLoading,
  };
};
