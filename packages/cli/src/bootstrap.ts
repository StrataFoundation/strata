import * as anchor from "@wum.bo/anchor";
import { BN } from "@wum.bo/anchor"
import { Transaction, PublicKey } from "@solana/web3.js";
import { createMetadata, Data, getMetadata, percent, TOKEN_PROGRAM_ID } from "@wum.bo/spl-utils";
import { SplTokenBonding, SplTokenBondingIDL, SplTokenBondingIDLJson } from "@wum.bo/spl-token-bonding";
import { SplWumbo, SplWumboIDL, SplWumboIDLJson } from "@wum.bo/spl-wumbo";
import { SplTokenStaking, SplTokenStakingIDL, SplTokenStakingIDLJson } from "@wum.bo/spl-token-staking";
import { SplTokenAccountSplit, SplTokenAccountSplitIDL, SplTokenAccountSplitIDLJson } from "@wum.bo/spl-token-account-split";
import { connection, createMintInstructions } from "@project-serum/common";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";

async function run() {
  console.log(process.env.ANCHOR_PROVIDER_URL)
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.getProvider();

  const splTokenBondingProgramId = new PublicKey("TBondz6ZwSM5fs4v2GpnVBMuwoncPkFLFR9S422ghhN")
  const splWumboProgramId = new PublicKey("WumbodN8t7wcDPCY2nGszs4x6HRtL5mJcTR519Qr6m7")
  const splTokenAccountSplitProgramId = new PublicKey("Sp1it1Djn2NmQvXLPnGM4zAXArxuchvSdytNt5n76Hm")
  const splTokenStakingProgramId = new PublicKey("TStakXwvzEZiK6PSNpXuNx6wEsKc93NtSaMxmcqG6qP")

  const splTokenBonding = new anchor.Program(SplTokenBondingIDLJson, splTokenBondingProgramId, provider) as anchor.Program<SplTokenBondingIDL>;
  const splWumbo = new anchor.Program(SplWumboIDLJson, splWumboProgramId, provider) as anchor.Program<SplWumboIDL>;
  const splTokenAccountSplit = new anchor.Program(SplTokenAccountSplitIDLJson, splTokenAccountSplitProgramId, provider) as anchor.Program<SplTokenAccountSplitIDL>;
  const splTokenStaking = new anchor.Program(SplTokenStakingIDLJson, splTokenStakingProgramId, provider) as anchor.Program<SplTokenStakingIDL>;

  const splTokenBondingProgram = new SplTokenBonding(provider, splTokenBonding);
  const splTokenStakingProgram = new SplTokenStaking(provider, splTokenStaking);
  const splTokenAccountSplitProgram = new SplTokenAccountSplit(provider, splTokenAccountSplit, splTokenStakingProgram);
  const splWumboProgram = new SplWumbo({
    provider,
    program: splWumbo,
    splTokenBondingProgram,
    splTokenAccountSplitProgram,
    splTokenStakingProgram
  });

  const wallet = splWumboProgram.wallet.publicKey;
  
  const curve = await splTokenBondingProgram.initializeCurve({
    curve: {
      // @ts-ignore
      fixedPriceCurveV0: {
        price: new BN(0_001000000000), // 0.001 SOL per. Max purchase of 100 WUM per instruction.
      },
      // logCurveV0: {
      //   c: new BN(1000000000000), // 1
      //   g: new BN(100000000000), // 0.1
      //   taylorIterations: 15,
      // },
    },
    taylorIterations: 15,
  });

  const signers1 = [];
  const instructions1 = [];
  const wumMintKeypair = anchor.web3.Keypair.generate();
  signers1.push(wumMintKeypair);
  const wumMint = wumMintKeypair.publicKey;
  instructions1.push(...(await createMintInstructions(provider, wallet, wumMint, 9)));

  await createMetadata(
    new Data({
      symbol: "bWUM",
      name: "bWUM",
      uri: "https://wumbo-token-metadata.s3.us-east-2.amazonaws.com/bwum.json",
      sellerFeeBasisPoints: 0,
      // @ts-ignore
      creators: null,
    }),
    wallet.toBase58(),
    wumMint.toBase58(),
    wallet.toBase58(),
    instructions1,
    wallet.toBase58()
  );

  // Change authority back to token bonding
  const [wumMintAuthority] = await PublicKey.findProgramAddress(
    [Buffer.from("target-authority", "utf-8"), wumMint.toBuffer()],
    splTokenBondingProgramId
  );
  instructions1.push(Token.createSetAuthorityInstruction(
    TOKEN_PROGRAM_ID,
    wumMint,
    wumMintAuthority,
    "MintTokens",
    wallet,
    []
  ))
  
  // Real wum
  // const { instructions: bondingInstructions, signers: bondingSigners, output: { targetMint, tokenBonding } } = await splTokenBondingProgram.createTokenBondingInstructions({
  //   curve,
  //   baseMint: new PublicKey(
  //     "So11111111111111111111111111111111111111112"
  //   ),
  //   authority: wallet,
  //   targetMint: wumMint,
  //   baseRoyaltyPercentage: percent(20),
  //   targetRoyaltyPercentage: percent(0),
  //   mintCap: new BN("1000000000000000000"), // 1 billion
  // });

  const baseStorage = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    new PublicKey(
      "So11111111111111111111111111111111111111112"
    ),
    wallet
  )

  const { instructions: bondingInstructions, signers: bondingSigners, output: { targetMint, tokenBonding } } = await splTokenBondingProgram.createTokenBondingInstructions({
    curve,
    baseMint: new PublicKey(
      "So11111111111111111111111111111111111111112"
    ),
    targetMintDecimals: 9,
    authority: wallet,
    targetMint: wumMint,
    baseRoyaltyPercentage: percent(0),
    targetRoyaltyPercentage: percent(0),
    mintCap: new BN("1000000000000000000"), // 1 billion
    purchaseCap: new BN("100000000000"),
    baseStorage
  });

  const { instructions: wumboInstructions, signers: wumboSigners, output: { wumbo } } = await splWumboProgram.createWumboInstructions({
    authority: wallet,
    wumMint: targetMint
  })
  const connection = provider.connection;
  const tx1 = new Transaction({
    recentBlockhash: (await connection.getRecentBlockhash('finalized')).blockhash,
    feePayer: wallet
  });
  tx1.add(...instructions1);

  await splWumboProgram.provider.send(tx1, signers1, { commitment: 'finalized', preflightCommitment: 'finalized' });

  const tx2 = new Transaction({
    recentBlockhash: (await connection.getRecentBlockhash('finalized')).blockhash,
    feePayer: wallet
  });
  // BETA ONLY
  if (!(await splWumboProgram.provider.connection.getAccountInfo(baseStorage))) {
    console.log("Missing base account")
    tx2.add(Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      new PublicKey(
        "So11111111111111111111111111111111111111112"
      ),
      baseStorage,
      wallet,
      wallet
    ));
  }
  
  tx2.add(...bondingInstructions);
  await splWumboProgram.provider.send(tx2, bondingSigners, { commitment: 'finalized', preflightCommitment: 'finalized' });

  const tx3 = new Transaction({
    recentBlockhash: (await connection.getRecentBlockhash('finalized')).blockhash,
    feePayer: wallet
  });
  tx3.add(...wumboInstructions);
  await splWumboProgram.provider.send(tx3, wumboSigners, { commitment: 'finalized', preflightCommitment: 'finalized' });

  await splWumboProgram.account.wumboV0.fetch(wumbo);
  console.log(`Wumbo: ${wumbo}, bonding: ${tokenBonding}, wum: ${targetMint}, wumMetadata: ${await getMetadata(wumMint.toBase58())}`);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
})