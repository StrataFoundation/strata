import { Provider } from "@project-serum/anchor";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { NATIVE_MINT, AccountLayout, TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID, AccountInfo as TokenAccountInfo, u64 } from '@solana/spl-token';
import { expect } from "chai";
export class TokenUtils {
  provider: Provider;

  constructor(provider: Provider) {
    this.provider = provider;
  }

  async expectBalance(account: PublicKey, balance: number) {
    if (!(await this.provider.connection.getAccountInfo(account))) {
      return 0;
    }
    const actual = await this.provider.connection.getTokenAccountBalance(account);
    expect(actual.value.uiAmount).to.equal(balance);
  }

  async expectBalanceWithin(account: PublicKey, balance: number, precision: number) {
    const actual = await this.provider.connection.getTokenAccountBalance(account);
    expect(actual.value.uiAmount).to.within(balance, precision);
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
    if (!(await provider.connection.getAccountInfo(newAccount))) {
      transaction.add(Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        NATIVE_MINT,
        newAccount,
        provider.wallet.publicKey,
        provider.wallet.publicKey
      ));
    }

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
    amount: number,
    to: PublicKey = provider.wallet.publicKey,
    authority: PublicKey = provider.wallet.publicKey,
    payer: PublicKey = provider.wallet.publicKey
  ): Promise<PublicKey> {
    const ata = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      to
    )
    const mintTx = new Transaction({ feePayer: payer });
    if (!await provider.connection.getAccountInfo(ata)) {
      mintTx.add(Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        ata,
        to,
        payer
      ))
    }
    mintTx.add(
      Token.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        mint,
        ata,
        authority,
        [],
        amount
      )
    )
    await provider.send(mintTx);
  
    return ata;
  }
}