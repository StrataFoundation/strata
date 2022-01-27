import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import { Connection, Keypair, sendAndConfirmTransaction, SystemProgram, Transaction } from '@solana/web3.js';
import { CreateMetadataV2, Metadata, DataV2 } from "@metaplex-foundation/mpl-token-metadata";

const serviceAccount = Keypair.fromSecretKey(
  Buffer.from(
    JSON.parse(
      require("fs").readFileSync(
        process.env.ANCHOR_WALLET!,
        {
          encoding: "utf-8",
        }
      )
    )
  )
);
const mintKeypair = Keypair.fromSecretKey(
  Buffer.from(
    JSON.parse(
      require("fs").readFileSync(
        process.env.MINT!,
        {
          encoding: "utf-8",
        }
      )
    )
  )
);


async function run(): Promise<void> {
  const connection = new Connection(process.env.SOLANA_URL!);
  const tx = new Transaction();
  const ata = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mintKeypair.publicKey, serviceAccount.publicKey);
  const instructions = [
    SystemProgram.createAccount({
      fromPubkey: serviceAccount.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: 82,
      lamports:
        await connection.getMinimumBalanceForRentExemption(
          82
        ),
      programId: TOKEN_PROGRAM_ID,
    }),
    Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mintKeypair.publicKey,
      9,
      serviceAccount.publicKey,
      null
    ),
    Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mintKeypair.publicKey,
      ata,
      serviceAccount.publicKey,
      serviceAccount.publicKey
    ),
    Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mintKeypair.publicKey,
      ata,
      serviceAccount.publicKey,
      [],
      new u64("10000000000000000")
    )
  ]
  instructions.push(...new CreateMetadataV2({
    feePayer: serviceAccount.publicKey
  }, {
    metadata: await Metadata.getPDA(mintKeypair.publicKey),
    mint: mintKeypair.publicKey,
    metadataData:  new DataV2({
      name: "Strata Provisional Governance",
      symbol: "sGOV",
      uri: "",
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null
    }),
    mintAuthority: serviceAccount.publicKey,
    updateAuthority: serviceAccount.publicKey
  }).instructions)
  tx.add(
    ...instructions,
    Token.createSetAuthorityInstruction(
      TOKEN_PROGRAM_ID,
      mintKeypair.publicKey,
      null,
      'MintTokens',
      serviceAccount.publicKey,
      []
    )
  );
  tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
  tx.feePayer = serviceAccount.publicKey;

  await sendAndConfirmTransaction(connection, tx, [serviceAccount, mintKeypair]);
  console.log(`Done creating ${mintKeypair.publicKey.toBase58()} mint, transfered all to ${ata.toBase58()}`);
}
run().catch(console.error)
