import * as anchor from "@wum.bo/anchor";
import { BN } from "@project-serum/anchor"
import { Transaction, PublicKey } from "@solana/web3.js";
import { createMetadata, Data, percent } from "@wum.bo/spl-utils";
import { SplTokenBonding, SplTokenBondingIDL, SplTokenBondingIDLJson } from "@wum.bo/spl-token-bonding";
import { SplWumbo, SplWumboIDL, SplWumboIDLJson } from "@wum.bo/spl-wumbo";
import { SplTokenStaking, SplTokenStakingIDL, SplTokenStakingIDLJson } from "@wum.bo/spl-token-staking";
import { SplTokenAccountSplit, SplTokenAccountSplitIDL, SplTokenAccountSplitIDLJson } from "@wum.bo/spl-token-account-split";
import { createMintInstructions } from "@project-serum/common";

async function run() {
  console.log(process.env.ANCHOR_PROVIDER_URL)
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.getProvider();

  const splTokenBondingProgramId = new PublicKey("CJMw4wALbZJswJCxLsYUj2ExGCaEgMAp8JSGjodbxAF4")
  const splWumboProgramId = new PublicKey("Bn6owcizWtLgeKcVyXVgUgTvbLezCVz9Q7oPdZu5bC1H")
  const splTokenAccountSplitProgramId = new PublicKey("5DbtwvnZnsAkRWc6q5u4FJ4NLc3cmALV637ybjP4wKzE")
  const splTokenStakingProgramId = new PublicKey("GEFM3nvcHypYtEZMxLrjuAUKwQjLuRcx1YaWXqa85WCm")

  const splTokenBonding = new anchor.Program(SplTokenBondingIDLJson, splTokenBondingProgramId, provider) as anchor.Program<SplTokenBondingIDL>;
  const splWumbo = new anchor.Program(SplWumboIDLJson, splWumboProgramId, provider) as anchor.Program<SplWumboIDL>;
  const splTokenAccountSplit = new anchor.Program(SplTokenAccountSplitIDLJson, splTokenAccountSplitProgramId, provider) as anchor.Program<SplTokenAccountSplitIDL>;
  const splTokenStaking = new anchor.Program(SplTokenStakingIDLJson, splTokenStakingProgramId, provider) as anchor.Program<SplTokenStakingIDL>;

  const splTokenBondingProgram = new SplTokenBonding(splTokenBonding);
  const splTokenStakingProgram = new SplTokenStaking(splTokenStaking);
  const splTokenAccountSplitProgram = new SplTokenAccountSplit(splTokenAccountSplit, splTokenStakingProgram);
  const splWumboProgram = new SplWumbo({
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
  
  const { instructions: bondingInstructions, signers: bondingSigners, output: { targetMint, tokenBonding } } = await splTokenBondingProgram.createTokenBondingInstructions({
    curve,
    baseMint: new PublicKey(
      "So11111111111111111111111111111111111111112"
    ),
    targetMintDecimals: 9,
    authority: wallet,
    baseRoyaltyPercentage: percent(20),
    targetRoyaltyPercentage: percent(0),
    mintCap: new BN(1_000_000_000), // 1 billion
    purchaseCap: new BN(100)
  });

  const { instructions: wumboInstructions, signers: wumboSigners, output: { wumbo } } = await splWumboProgram.createWumboInstructions({
    authority: wallet,
    wumMint: targetMint
  })
  const tx1 = new Transaction();
  tx1.add(...instructions1);

  const tx2 = new Transaction();
  tx2.add(...bondingInstructions);

  const tx3 = new Transaction();
  tx3.add(...wumboInstructions);

  await splWumboProgram.provider.sendAll([{ tx: tx1, signers: signers1 }, { tx: tx2, signers: bondingSigners }, { tx: tx3, signers: wumboSigners }]);

  await splWumboProgram.account.wumboV0.fetch(wumbo);
  console.log(`Wumbo: ${wumbo}, bonding: ${tokenBonding}, wum: ${targetMint}`);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
})