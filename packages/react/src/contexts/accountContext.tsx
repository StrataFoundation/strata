import React, { FC, ReactNode, createContext, useMemo, useEffect, useState } from "react";
import { AccountInfo, Commitment, PublicKey } from "@solana/web3.js";
import { AccountFetchCache } from "@strata-foundation/spl-utils";
import { DEFAULT_COMMITMENT } from "../constants";
import { useConnection } from "@solana/wallet-adapter-react";

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
  const [cache, setCache] = useState<AccountFetchCache>(
    connection && new AccountFetchCache({
      connection,
      delay: 500,
      commitment,
      extendConnection,
    })
  );
  useEffect(() => {
    if (connection) {
      cache.close();

      setCache(
        new AccountFetchCache({
          connection,
          delay: 500,
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
