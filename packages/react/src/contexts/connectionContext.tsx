import React, { FC, ReactNode, createContext, useEffect, useMemo } from "react";
import { Connection, Keypair } from "@solana/web3.js";
import { SOLANA_API_URL, DEFAULT_COMMITMENT } from "../constants";
import { useLocalStorage } from "../hooks";

export interface IConnectionProviderProps {
  children: ReactNode;
}

export interface IConnectionContextState {
  endpoint: string;
  setEndpoint: (val: string) => void;
  connection: Connection;
}

export const ConnectionContext = createContext<IConnectionContextState>({
  endpoint: SOLANA_API_URL,
  setEndpoint: () => {},
  connection: new Connection(SOLANA_API_URL, DEFAULT_COMMITMENT),
});

export const ConnectionProvider: FC<IConnectionProviderProps> = ({
  children,
}) => {
  const [endpoint, setEndpoint] = useLocalStorage(
    "connectionEndpoint",
    SOLANA_API_URL
  );

  const connection = useMemo(
    () => new Connection(endpoint, DEFAULT_COMMITMENT),
    [endpoint]
  );

  // The websocket library solana/web3.js uses closes its websocket connection when the subscription list
  // is empty after opening its first time, preventing subsequent subscriptions from receiving responses.
  // This is a hack to prevent the list from every getting empty
  useEffect(() => {
    const id = connection.onAccountChange(
      Keypair.generate().publicKey,
      () => {}
    );
    return () => {
      connection.removeAccountChangeListener(id);
    };
  }, [connection]);

  useEffect(() => {
    const id = connection.onSlotChange(() => null);
    return () => {
      connection.removeSlotChangeListener(id);
    };
  }, [connection]);

  return (
    <ConnectionContext.Provider
      value={{
        endpoint,
        setEndpoint,
        connection,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};
