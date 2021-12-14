import { PublicKey } from "@solana/web3.js";
import { usePriceInSol } from "./usePriceInSol";
import { useSolPrice } from "./useSolPrice";

export function usePriceInUsd(
  token: PublicKey | undefined | null
): number | undefined {
  const solPrice = useSolPrice();
  const solAmount = usePriceInSol(token);

  return solAmount && solPrice && solAmount * solPrice;
}
