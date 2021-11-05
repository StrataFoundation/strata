import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useAsync } from "react-async-hook";
import { getWalletTokenAccounts } from "../utils";

/**
 * Get all token accounts associated with this wallet
 * @param owner
 * @returns
 */
export const useWalletTokenAccounts = (owner?: PublicKey) => {
  const { connection } = useConnection();
  return useAsync(getWalletTokenAccounts, [connection, owner]);
};
