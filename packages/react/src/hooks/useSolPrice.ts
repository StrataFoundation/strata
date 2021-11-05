import { SolPriceContext } from "../contexts";
import { useContext } from "react";

export const useSolPrice = () => {
  return useContext(SolPriceContext);
};
