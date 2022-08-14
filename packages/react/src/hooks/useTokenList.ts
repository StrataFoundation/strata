import { TokenListContext } from "../contexts/tokenList";
import { useContext } from "react";

export const useTokenList = () => {
  return useContext(TokenListContext);
}
