import { useContext } from "react";
import { AccountContext } from "../contexts";

export const useAccountFetchCache = () => {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error("useAccountFetchCache must be used within AccountProvider");
  }

  return context;
};
