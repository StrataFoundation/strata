import { PublicKey } from "@solana/web3.js";
import { useAsync } from "react-async-hook";
import { useConnection } from "../hooks";
import { getUserTokenAccounts } from "../utlis";

export const useUserTokenAccounts = (owner?: PublicKey) => {
  const connection = useConnection();
  return useAsync(getUserTokenAccounts, [connection, owner]);
};
