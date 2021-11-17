import { useAccount, UseAccountState } from ".";
import { TokenAccountParser } from "../utils";
import { AccountInfo as TokenAccountInfo, Token } from "@solana/spl-token";
import { AccountInfo, PublicKey } from "@solana/web3.js";

const parser = (
  pubkey: PublicKey,
  acct: AccountInfo<Buffer>
): TokenAccountInfo | undefined => {
  return TokenAccountParser(pubkey, acct)?.info;
};

export function useTokenAccount(
  address: PublicKey | undefined
): UseAccountState<TokenAccountInfo | undefined> {
  return useAccount(address, parser);
}
