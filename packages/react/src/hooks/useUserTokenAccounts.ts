import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useAsync } from "react-async-hook";
import { getUserTokenAccounts } from "../utils";

export const useUserTokenAccounts = (owner?: PublicKey) => {
  const { connection } = useConnection();
  return useAsync(getUserTokenAccounts, [connection, owner]);
};
