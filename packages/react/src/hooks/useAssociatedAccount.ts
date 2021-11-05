import { AccountInfo as TokenAccountInfo, Token } from "@solana/spl-token";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { TokenAccountParser } from "../utils";
import { useAccount } from "./useAccount";
import { useAssociatedTokenAddress } from "./useAssociatedTokenAddress";

export interface AssociatedAccountState {
  associatedAccount?: TokenAccountInfo;
  associatedAccountKey?: PublicKey;
  loading: boolean;
}

/**
 * Get the associcated token account for this wallet, or the account itself is this address is already an ata
 *
 * @param walletOrAta 
 * @param mint 
 * @returns 
 */
export function useAssociatedAccount(
  walletOrAta: PublicKey | undefined | null,
  mint: PublicKey | undefined
): AssociatedAccountState {
  const { result: associatedTokenAddress, loading: associatedTokenLoading } =
    useAssociatedTokenAddress(walletOrAta, mint);
  const parser = (pubkey: PublicKey, acct: AccountInfo<Buffer>): TokenAccountInfo | undefined => {
    return TokenAccountParser(pubkey, acct)?.info;
  }
  const { info: associatedAccount, loading } = useAccount(
    associatedTokenAddress,
    parser
  );
  const { info: account, loading: loading2 } = useAccount(
    walletOrAta || undefined,
    parser
  );

  const result = useMemo(() => {
    if (account?.mint === mint) { // The passed value is the ata
      return account;
    } else {
      return associatedAccount
    }
  }, [associatedAccount, account])

  return {
    associatedAccount: result,
    loading: loading || loading2,
    associatedAccountKey: associatedTokenAddress
  };
}