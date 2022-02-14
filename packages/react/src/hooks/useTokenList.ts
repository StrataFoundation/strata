import { TokenListContext } from "../contexts";
import { useContext } from "react";

export const useTokenList = () => {
  return useContext(TokenListContext);
}
