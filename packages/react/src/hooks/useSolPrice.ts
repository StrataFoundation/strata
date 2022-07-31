import { SolPriceContext } from "../contexts/solPrice";
import { useContext } from "react";

export const useSolPrice = () => {
  return useContext(SolPriceContext);
};
