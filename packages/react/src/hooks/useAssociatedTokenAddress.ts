import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID } from "@strata-foundation/spl-utils";
import { useEffect, useState } from "react";

interface AssocState {
  loading: boolean;
  result?: PublicKey;
}
const fetch = (wallet: PublicKey, mint: PublicKey) =>
  Token.getAssociatedTokenAddress(
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    wallet
  );
export function useAssociatedTokenAddress(
  wallet: PublicKey | undefined | null,
  mint: PublicKey | undefined | null
): AssocState {
  const [state, setState] = useState<AssocState>({ loading: true });
  useEffect(() => {
    if (!mint || !wallet) {
      return;
    }

    fetch(wallet, mint)
      .then((result) => {
        if (!state.result || result.toString() != state.result.toString()) {
          setState({ result, loading: false });
        }
      })
      .catch(() => {});
  }, [wallet, mint]);

  return state;
}
