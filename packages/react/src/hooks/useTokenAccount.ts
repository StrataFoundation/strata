import { useAccount, UseAccountState } from "./useAccount";
import { TokenAccountParser } from "../utils/getWalletTokenAccounts";
import { AccountInfo as TokenAccountInfo, Token } from "@solana/spl-token";
import { AccountInfo, PublicKey } from "@solana/web3.js";

const parser = (
  pubkey: PublicKey,
  acct: AccountInfo<Buffer>
): TokenAccountInfo | undefined => {
  return TokenAccountParser(pubkey, acct)?.info;
};

export function useTokenAccount(
  address: PublicKey | undefined | null
): UseAccountState<TokenAccountInfo | undefined> {
  return useAccount(address, parser);
}
