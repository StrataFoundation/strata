import { AccountInfo as TokenAccountInfo } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { useAssociatedTokenAddress } from "./useAssociatedTokenAddress";
import { useTokenAccount } from "./useTokenAccount";

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
  const { info: associatedAccount, loading } = useTokenAccount(
    associatedTokenAddress
  );
  const { info: account, loading: loading2 } = useTokenAccount(
    walletOrAta || undefined
  );

  const result = useMemo(() => {
    if (account?.mint === mint) {
      // The passed value is the ata
      return account;
    } else {
      return associatedAccount;
    }
  }, [associatedAccount, account]);

  return {
    associatedAccount: result,
    loading: loading || loading2,
    associatedAccountKey: associatedTokenAddress,
  };
}
