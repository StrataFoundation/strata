import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useAsync } from "react-async-hook";

interface AssocState {
  loading: boolean;
  result?: PublicKey;
}
const fetch = async (
  wallet: PublicKey | undefined | null,
  mint: PublicKey | undefined | null
): Promise<PublicKey | undefined> => {
  if (!wallet || !mint) {
    return undefined;
  }

  return Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    wallet,
    true
  );
};

export function useAssociatedTokenAddress(
  wallet: PublicKey | undefined | null,
  mint: PublicKey | undefined | null
): AssocState {
  const { result, loading } = useAsync(fetch, [wallet, mint]);

  return { result, loading };
}
