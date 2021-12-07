import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID } from "@strata-foundation/spl-utils";
import { useEffect, useState } from "react";
import { useAsync } from "react-async-hook";

interface AssocState {
  loading: boolean;
  result?: PublicKey;
}
const fetch = async (wallet: PublicKey | undefined | null, mint: PublicKey | undefined | null): Promise<PublicKey | undefined> => {
  if (!wallet || !mint) {
    return undefined;
  }

  return Token.getAssociatedTokenAddress(
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    wallet
  );
}

export function useAssociatedTokenAddress(
  wallet: PublicKey | undefined | null,
  mint: PublicKey | undefined | null
): AssocState {
  const { result, loading } = useAsync(fetch, [wallet, mint]);

  return { result, loading };
}
