import { Provider } from "@wum.bo/anchor";
import { PublicKey, Transaction} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID, AccountInfo as TokenAccountInfo, u64 } from '@solana/spl-token';

export class TokenUtils {
  provider: Provider;

  constructor(provider: Provider) {
    this.provider = provider;
  }

  async createAtaAndMint(
    provider: Provider,
    mint: PublicKey,
    amount: number
  ): Promise<PublicKey> {
    const ata = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      provider.wallet.publicKey
    )
    const mintTx = new Transaction();
    mintTx.add(
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        ata,
        provider.wallet.publicKey,
        provider.wallet.publicKey
      ),
      Token.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        mint,
        ata,
        provider.wallet.publicKey,
        [],
        amount
      )
    )
    await provider.send(mintTx);
  
    return ata;
  }
}