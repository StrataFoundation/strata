import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenAmount, PublicKey, Connection } from "@solana/web3.js";

export async function getAssociatedAccountBalance(connection: Connection, account: PublicKey, mint: PublicKey): Promise<TokenAmount> {
  const ata = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    account,
    true
  );

  return (await connection.getTokenAccountBalance(ata)).value;
}
