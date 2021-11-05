import { useContext } from "react";
import { AccountContext } from "../contexts";

/**
 * Get the Strata account fetch cache to save on rcp calls. Generally, you want to use {@link useAccount}
 * @returns 
 */
export const useAccountFetchCache = () => {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error("useAccountFetchCache must be used within AccountProvider");
  }

  return context;
};
