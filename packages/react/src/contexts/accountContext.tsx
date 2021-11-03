import React, { FC, ReactNode, createContext, useMemo, useEffect } from "react";
import { AccountInfo, Commitment, PublicKey } from "@solana/web3.js";
import { AccountFetchCache } from "../utlis";
import { useConnection } from "../hooks";
import { DEFAULT_COMMITMENT } from "../constants";

export interface IAccountProviderProps {
  children: ReactNode;
}

export const AccountContext = createContext<AccountFetchCache>(
  {} as AccountFetchCache
);

export const AccountProvider: FC<IAccountProviderProps> = ({ children }) => {
  const connection = useConnection();
  const cache = useMemo(() => {
    return new AccountFetchCache({
      connection,
      delay: 500,
      commitment: DEFAULT_COMMITMENT,
    });
  }, [connection]);

  useEffect(() => {
    const oldGetAccountInfo = connection.getAccountInfo.bind(connection);
    // Make sure everything in our app is using the cache
    connection.getAccountInfo = async (
      publicKey: PublicKey,
      commitment?: Commitment
    ): Promise<AccountInfo<Buffer> | null> => {
      if (commitment && commitment != DEFAULT_COMMITMENT) {
        return oldGetAccountInfo(publicKey, commitment);
      }

      return cache.search(publicKey).then((i) => {
        if (i) {
          return i.account;
        }

        return null;
      });
    };

    return () => {
      cache.close();
    };
  }, [connection]);

  return (
    <AccountContext.Provider value={cache}>{children}</AccountContext.Provider>
  );
};
