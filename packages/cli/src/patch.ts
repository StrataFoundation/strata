import * as anchor from "@project-serum/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { ExponentialCurveConfig, SplTokenBonding, TimeCurve, TimeCurveConfig } from "@strata-foundation/spl-token-bonding";
import { ITokenRef, SplTokenCollective } from "@strata-foundation/spl-token-collective";
import { getMetadata, percent } from "@strata-foundation/spl-utils";
import fs from "fs";

async function run() {
  console.log(process.env.ANCHOR_PROVIDER_URL)
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.getProvider();

  const tokenBondingSdk = await SplTokenBonding.init(provider);
  const tokenCollectiveSdk = await SplTokenCollective.init(provider);

  const tokenRefs = await tokenCollectiveSdk.account.tokenRefV0.all();
  const bondingByTokenRef = tokenRefs.filter(tokenRef => tokenRef.account.isClaimed).reduce((acc: Record<string, ITokenRef>, tokenRef: any) => {
    // @ts-ignore
    acc[tokenRef.account.tokenBonding.toBase58()] = {
      ...tokenRef.account,
      publicKey: tokenRef.publicKey
    }
    return acc;
  }, {} as Record<string, ITokenRef>);

  for (const [tokenBonding, tokenRef] of Object.entries(bondingByTokenRef)) {
    if (!tokenRef.owner)  {
      throw new Error("No owner, why?")
    }

    console.log(`Patching bonding ${tokenBonding} to point to ${tokenRef.owner.toBase58()}`);
    const bonding = (await tokenBondingSdk.getTokenBonding(tokenRef.tokenBonding!))!;
    const baseRoyalties = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      bonding.baseMint,
      tokenRef.owner!,
    );
    const targetRoyalties = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      bonding.targetMint,
      tokenRef.owner!,
    );
    const mintTokenRef = (await SplTokenCollective.mintTokenRefKey(tokenRef.mint))[0];

    if (bonding.buyBaseRoyalties.equals(baseRoyalties) || bonding.buyTargetRoyalties.equals(targetRoyalties)) {
      console.log(`Skipping ${tokenBonding} because royalties aleady point to ${tokenRef.owner.toBase58()}`);
    }

    const instructions = [];
    if (!(await tokenBondingSdk.accountExists(baseRoyalties))) {
      instructions.push(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          bonding.baseMint,
          baseRoyalties,
          tokenRef.owner!,
          provider.wallet.publicKey
        )
      );
    }
    if (!(await tokenBondingSdk.accountExists(targetRoyalties))) {
      instructions.push(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          bonding.targetMint,
          targetRoyalties,
          tokenRef.owner!,
          provider.wallet.publicKey
        )
      );
    }

    instructions.push(await tokenCollectiveSdk.program.instruction.patchRoyalties({
      accounts: {
        strata: provider.wallet.publicKey,
        mintTokenRef,
        tokenBonding: bonding.publicKey,
        tokenBondingProgram: tokenBondingSdk.programId,
        baseMint: bonding.baseMint,
        targetMint: bonding.targetMint,
        buyBaseRoyalties: baseRoyalties,
        buyTargetRoyalties: targetRoyalties,
        sellBaseRoyalties: baseRoyalties,
        sellTargetRoyalties: targetRoyalties
      }
    }));

    await tokenCollectiveSdk.sendInstructions(instructions, []);
  }
}

run().catch(e => {
  console.error(e);
  process.exit(1);
})
