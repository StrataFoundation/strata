import { AnchorProvider } from "@project-serum/anchor";
import { PublicKey, Transaction, SystemProgram, Keypair } from "@solana/web3.js";
import { NATIVE_MINT, AccountLayout, TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID, AccountInfo as TokenAccountInfo, u64 } from '@solana/spl-token';
import { expect } from "chai";
import {
  Creator,
  DataV2,
  Collection,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createMint,
  SplTokenMetadata,
  createAtaAndMint,
} from "@strata-foundation/spl-utils";

export class TokenUtils {
  provider: AnchorProvider;

  constructor(provider: AnchorProvider) {
    this.provider = provider;
  }

  async expectBalance(account: PublicKey, balance: number) {
    if (!(await this.provider.connection.getAccountInfo(account))) {
      return 0;
    }
    const actual = await this.provider.connection.getTokenAccountBalance(
      account
    );
    expect(actual.value.uiAmount).to.equal(balance);
  }

  async expectBalanceWithin(
    account: PublicKey,
    balance: number,
    precision: number
  ) {
    const actual = await this.provider.connection.getTokenAccountBalance(
      account
    );
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

  async createWrappedNativeAccount(
    provider: AnchorProvider,
    amount: number
  ): Promise<PublicKey> {
    const newAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      NATIVE_MINT,
      provider.wallet.publicKey
    );

    const transaction = new Transaction();
    if (!(await provider.connection.getAccountInfo(newAccount))) {
      transaction.add(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          NATIVE_MINT,
          newAccount,
          provider.wallet.publicKey,
          provider.wallet.publicKey
        )
      );
    }

    // Send lamports to it (these will be wrapped into native tokens by the token program)
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: newAccount,
        lamports: amount,
      })
    );
    // Assign the new account to the native token mint.
    // the account will be initialized with a balance equal to the native token balance.
    // (i.e. amount)
    // transaction.add(Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, NATIVE_MINT, newAccount.publicKey, provider.wallet.publicKey)); // Send the three instructions
    await provider.sendAndConfirm(transaction);

    return newAccount;
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
    );
    await this.provider.sendAndConfirm(mintTx);
  }

  async createTestNft(
    provider: AnchorProvider,
    recipient: PublicKey,
    mintKeypair: Keypair=Keypair.generate(),
    holderKey: PublicKey=provider.wallet.publicKey,
    collectionKey?: PublicKey,
  ): Promise<{mintKey: PublicKey, collectionKey: PublicKey | undefined}> {
    const splTokenMetadata = await SplTokenMetadata.init(provider);
    const mintKey = await createMint(provider, this.provider.wallet.publicKey, 0, mintKeypair);
    await splTokenMetadata.createMetadata({
      data: new DataV2({
        name: "test",
        symbol: "TST",
        uri: "http://test/",
        sellerFeeBasisPoints: 10,
        creators: [
          new Creator({
            address: holderKey.toBase58(),
            verified: true,
            share: 100,
          }),
        ],
        collection: collectionKey ? new Collection({ key: collectionKey.toBase58(), verified: false }): null,
        uses: null,
      }),
      mint: mintKey,
    });

    await createAtaAndMint(
      provider,
      mintKeypair.publicKey,
      1,
      recipient
    );

    if (collectionKey) {
      await splTokenMetadata.verifyCollection({
        collectionMint: collectionKey,
        nftMint: mintKeypair.publicKey,
      })
    }

    return {
      mintKey,
      collectionKey,
    };
  }

  async createTestNftCollection(
    provider: AnchorProvider,
    recipient: PublicKey,
    mintKeypair: Keypair=Keypair.generate(),
    holderKey: PublicKey=provider.wallet.publicKey,
  ) {
    await this.createTestNft(provider, recipient, mintKeypair, holderKey);
    const splTokenMetadata = await SplTokenMetadata.init(provider);
    await splTokenMetadata.createMasterEdition({
      mint: mintKeypair.publicKey,
    });
  }
}