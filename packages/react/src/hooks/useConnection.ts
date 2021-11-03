import { useContext } from "react";
import { ConnectionContext } from "../contexts";

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error("useConnection must be used within ConnectionProvider");
  }

  return context.connection;
};
