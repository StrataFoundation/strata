import * as anchor from "@wum.bo/anchor";
import { BN } from "@project-serum/anchor"
import { Transaction, PublicKey } from "@solana/web3.js";
import { percent } from "../packages/spl-utils/dist/lib";
import { SplTokenBonding, SplTokenBondingIDL, SplTokenBondingIDLJson } from "../packages/spl-token-bonding/dist/lib";
import { SplWumbo, SplWumboIDL, SplWumboIDLJson } from "../packages/spl-wumbo/dist/lib";
import { SplTokenStaking, SplTokenStakingIDL, SplTokenStakingIDLJson } from "../packages/spl-token-staking/dist/lib";
import { SplTokenAccountSplit, SplTokenAccountSplitIDL, SplTokenAccountSplitIDLJson } from "../packages/spl-token-account-split/dist/lib";


async function run() {
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
  
  const curve = await splTokenBondingProgram.initializeCurve({
    curve: {
      // @ts-ignore
      logCurveV0: {
        c: new BN(1000000000000), // 1
        g: new BN(100000000000), // 0.1
        taylorIterations: 15,
      },
    },
    taylorIterations: 15,
  });
  const { instructions: bondingInstructions, signers: bondingSigners, output: { targetMint, tokenBonding } } = await splTokenBondingProgram.createTokenBondingInstructions({
    curve,
    baseMint: new PublicKey(
      "So11111111111111111111111111111111111111112"
    ),
    targetMintDecimals: 9,
    authority: splWumboProgram.wallet.publicKey,
    baseRoyaltyPercentage: percent(20),
    targetRoyaltyPercentage: percent(0),
    mintCap: new BN(1_000_000_000), // 1 billion
  });

  const { instructions: wumboInstructions, signers: wumboSigners, output: { wumbo } } = await splWumboProgram.createWumboInstructions({
    wumMint: targetMint
  })
  const tx1 = new Transaction();
  tx1.add(...bondingInstructions);

  const tx2 = new Transaction();
  tx2.add(...wumboInstructions);

  await splWumboProgram.provider.sendAll([{ tx: tx1, signers: bondingSigners }, { tx: tx2, signers: wumboSigners }]);

  console.log(`Wumbo: ${wumbo}, bonding: ${tokenBonding}, wum: ${targetMint}`);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
})