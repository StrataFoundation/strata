import { BN } from "@wum.bo/anchor";
import { PublicKey } from "@solana/web3.js";
import { percent } from "./packages/spl-utils/src";
import { SplTokenBonding } from "./packages/spl-token-bonding/src";

async function run() {
  anchor.setProvider(anchor.Provider.local());
  const program = anchor.workspace.SplWumbo;
  const splTokenBondingProgram = new SplTokenBonding(anchor.workspace.SplTokenBonding);
  
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
  const { instructions: bondingInstructions, signers: bondingSigners, output: { targetMint } } = await splTokenBondingProgram.createTokenBondingInstructions({
    curve,
    baseMint: new PublicKey(
      "So11111111111111111111111111111111111111112"
    ),
    targetMintDecimals: 9,
    authority: this.wallet.publicKey,
    baseRoyaltyPercentage: percent(20),
    targetRoyaltyPercentage: percent(0),
    mintCap: new BN(1_000_000_000), // 1 billion
  });

  
}
