import { Provider } from "@wum.bo/anchor";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { NATIVE_MINT, AccountLayout, TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID, AccountInfo as TokenAccountInfo, u64 } from '@solana/spl-token';
import { expect } from "chai";
export class TokenUtils {
  provider: Provider;

  constructor(provider: Provider) {
    this.provider = provider;
  }

  async expectBalance(account: PublicKey, balance: number) {
    const actual = await this.provider.connection.getTokenAccountBalance(account);
    expect(actual.value.uiAmount).to.equal(balance);
  }

  async expectAtaBalance(account: PublicKey, mint: PublicKey, balance: number) {
    const ata = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      account
    );
    return this.expectBalance(ata, balance);
  }

  async createWrappedNativeAccount(provider: Provider, amount: number): Promise<PublicKey> {
    const newAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      NATIVE_MINT,
      provider.wallet.publicKey
    );

    const transaction = new Transaction();
    transaction.add(Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      NATIVE_MINT,
      newAccount,
      provider.wallet.publicKey,
      provider.wallet.publicKey
    ));

    // Send lamports to it (these will be wrapped into native tokens by the token program)
    transaction.add(SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: newAccount,
      lamports: amount
    })); 
    // Assign the new account to the native token mint.
    // the account will be initialized with a balance equal to the native token balance.
    // (i.e. amount)
    // transaction.add(Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, NATIVE_MINT, newAccount.publicKey, provider.wallet.publicKey)); // Send the three instructions
    await provider.send(transaction);

    return newAccount
  }

  async mintTo(
    mint: PublicKey,
    amount: number,
    destination: PublicKey
  ): Promise<void> {
    const mintTx = new Transaction();
    mintTx.add(
      Token.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        mint,
        destination,
        this.provider.wallet.publicKey,
        [],
        amount
      )
    )
    await this.provider.send(mintTx);
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