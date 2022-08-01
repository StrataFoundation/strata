import { useConnection } from "@solana/wallet-adapter-react";
import { Commitment } from "@solana/web3.js";
import { AccountFetchCache } from "@strata-foundation/spl-utils";
import { createContext, FC, ReactNode, useEffect, useState } from "react";
import { DEFAULT_COMMITMENT } from "../constants/globals";

export interface IAccountProviderProps {
  children: ReactNode;
  commitment: Commitment;
  extendConnection?: boolean;
}

export const AccountContext = createContext<AccountFetchCache | undefined>(
  undefined
);

export const AccountProvider: FC<IAccountProviderProps> = ({
  children,
  commitment = DEFAULT_COMMITMENT,
  extendConnection = true,
}) => {
  const { connection } = useConnection();
  const [cache, setCache] = useState<AccountFetchCache>();
  useEffect(() => {
    if (connection) {
      cache?.close();

      setCache(
        new AccountFetchCache({
          connection,
          delay: 50,
          commitment,
          extendConnection,
        })
      );
    }
  }, [connection]);

  return (
    <AccountContext.Provider value={cache}>{children}</AccountContext.Provider>
  );

  return null;
};
