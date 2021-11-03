import * as anchor from "@project-serum/anchor";
import { Transaction, PublicKey, Keypair } from "@solana/web3.js";
import { createMetadata, Data, getMetadata, percent, TOKEN_PROGRAM_ID } from "@strata-foundation/spl-utils";
import { SplTokenBonding, SplTokenBondingIDL, SplTokenBondingIDLJson, ExponentialCurveConfig } from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective, SplTokenCollectiveIDL, SplTokenCollectiveIDLJson } from "@strata-foundation/spl-token-collective";
import { createMintInstructions } from "@project-serum/common";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import fs from "fs";

async function run() {
  console.log(process.env.ANCHOR_PROVIDER_URL)
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.getProvider();

  const splTokenBondingProgramId = new PublicKey("TBondz6ZwSM5fs4v2GpnVBMuwoncPkFLFR9S422ghhN")
  const splTokenCollectiveProgramId = new PublicKey("WumbodN8t7wcDPCY2nGszs4x6HRtL5mJcTR519Qr6m7")

  const splTokenBonding = new anchor.Program(SplTokenBondingIDLJson, splTokenBondingProgramId, provider) as anchor.Program<SplTokenBondingIDL>;
  const splTokenCollective = new anchor.Program(SplTokenCollectiveIDLJson, splTokenCollectiveProgramId, provider) as anchor.Program<SplTokenCollectiveIDL>;

  const splTokenBondingProgram = new SplTokenBonding(provider, splTokenBonding);
  const splTokenCollectiveProgram = new SplTokenCollective({
    provider,
    program: splTokenCollective,
    splTokenBondingProgram,
  });

  const wallet = splTokenCollectiveProgram.wallet.publicKey;
  
  await splTokenBondingProgram.initializeSolStorage();
  const curve = await splTokenBondingProgram.initializeCurve({
    config: new ExponentialCurveConfig({
      c: 0.001,
      b: 0,
      pow: 1,
      frac: 2
    })
  });
  const socialCurve = await splTokenBondingProgram.initializeCurve({
    config: new ExponentialCurveConfig({
      c: 0.0001,
      b: 0,
      pow: 1,
      frac: 2
    })
  });

  const signers1 = [];
  const instructions1 = [];
  const openMintKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(process.env.OPEN_MINT_PATH!).toString())));
  signers1.push(openMintKeypair);
  const openMint = openMintKeypair.publicKey;
  instructions1.push(...(await createMintInstructions(provider, wallet, openMint, 9)));

  await createMetadata(
    new Data({
      symbol: "OPEN",
      name: "Open Collective",
      uri: "https://wumbo-token-metadata.s3.us-east-2.amazonaws.com/open.json",
      sellerFeeBasisPoints: 0,
      // @ts-ignore
      creators: null,
    }),
    wallet.toBase58(),
    openMint.toBase58(),
    wallet.toBase58(),
    instructions1,
    wallet.toBase58()
  );

  const { instructions: openCollectiveInstructions, signers: openCollectiveSigners, output: { collective: openCollective } } = await splTokenCollectiveProgram.createCollectiveInstructions({
    mintAuthority: wallet,
    authority: wallet,
    mint: openMint,
    config: {
      isOpen: true,
      unclaimedTokenBondingSettings: {
        curve: socialCurve,
        buyBaseRoyalties: {
          ownedByName: true,
        },
        sellBaseRoyalties: {
          ownedByName: true,
        },
        buyTargetRoyalties: {
          ownedByName: true,
        },
        sellTargetRoyalties: {
          ownedByName: true,
        },
        minBuyBaseRoyaltyPercentage: 0,
        maxBuyBaseRoyaltyPercentage: 0,
        minSellBaseRoyaltyPercentage: 0,
        maxSellBaseRoyaltyPercentage: 0,
        minBuyTargetRoyaltyPercentage: 5,
        maxBuyTargetRoyaltyPercentage: 5,
        minSellTargetRoyaltyPercentage: 0,
        maxSellTargetRoyaltyPercentage: 0,
      },
      unclaimedTokenMetadataSettings: {
        symbol: "UNCLAIMED",
        nameIsNameServiceName: true,
        uri: "https://wumbo-token-metadata.s3.us-east-2.amazonaws.com/open.json",
      },
      claimedTokenBondingSettings: {
        maxSellBaseRoyaltyPercentage: 20,
        maxSellTargetRoyaltyPercentage: 20,
      }
    }
  });

  // Change authority back to token bonding
  const instructions3 = [];
  const [openMintAuthority] = await PublicKey.findProgramAddress(
    [Buffer.from("target-authority", "utf-8"), openMint.toBuffer()],
    splTokenBondingProgramId
  );
  instructions3.push(Token.createSetAuthorityInstruction(
    TOKEN_PROGRAM_ID,
    openMint,
    openMintAuthority,
    "MintTokens",
    wallet,
    []
  ));

  const { instructions: bondingInstructions, signers: bondingSigners, output: { targetMint, tokenBonding } } = await splTokenBondingProgram.createTokenBondingInstructions({
    curve,
    baseMint: new PublicKey(
      "So11111111111111111111111111111111111111112"
    ),
    targetMintDecimals: 9,
    authority: wallet,
    targetMint: openMint,
    buyBaseRoyaltyPercentage: 0,
    buyTargetRoyaltyPercentage: 0,
    sellBaseRoyaltyPercentage: 0,
    sellTargetRoyaltyPercentage: 0,
    index: 0
  });
  instructions3.push(...bondingInstructions);

  const connection = provider.connection;
  console.log("Sending txn 1/3...");
  const tx1 = new Transaction({
    recentBlockhash: (await connection.getRecentBlockhash('finalized')).blockhash,
    feePayer: wallet
  });
  tx1.add(...instructions1);

  await splTokenCollectiveProgram.provider.send(tx1, signers1, { commitment: 'finalized', preflightCommitment: 'finalized' });

  console.log("Sending txn 2/3...");
  const tx2 = new Transaction({
    recentBlockhash: (await connection.getRecentBlockhash('finalized')).blockhash,
    feePayer: wallet
  });
  
  tx2.add(...openCollectiveInstructions);
  await splTokenCollectiveProgram.provider.send(tx2, openCollectiveSigners, { commitment: 'finalized', preflightCommitment: 'finalized' });

  console.log("Sending txn 3/3...");
  const tx3 = new Transaction({
    recentBlockhash: (await connection.getRecentBlockhash('finalized')).blockhash,
    feePayer: wallet
  });
  tx3.add(...instructions3);
  await splTokenCollectiveProgram.provider.send(tx3, bondingSigners, { commitment: 'finalized', preflightCommitment: 'finalized' });

  await splTokenCollectiveProgram.account.collectiveV0.fetch(openCollective);
  console.log(`Open Collective: ${openCollective}, bonding: ${tokenBonding}, open: ${targetMint}, openMetadata: ${await getMetadata(openMint.toBase58())}`);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
})