import * as anchor from "@project-serum/anchor";
import { Provider } from "@project-serum/anchor";
import { createMint, getTokenAccount } from "@project-serum/common";
import { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { ExponentialCurveConfig, SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import { Data, getMetadata, SplTokenMetadata } from "@strata-foundation/spl-utils";
import fs from "fs";
import BN from "bn.js";

async function mintTo(
  provider: Provider,
  mint: PublicKey,
  amount: number,
  destination: PublicKey
): Promise<void> {
  const ata = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    destination,
    true
  );
  const mintTx = new Transaction();
  if (!await provider.connection.getAccountInfo(ata)) {
    mintTx.add(Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      ata,
      destination,
      provider.wallet.publicKey
    ));
  }
  mintTx.add(
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
}

async function createTestBwum(provider: Provider): Promise<PublicKey> {
  const betaWumDest1 = new PublicKey("Ge2eyjRosNwZAcQDQqJ3R4gXBy2BcpYstZYWQDUq5Rg");
  const betaWumDest2 = new PublicKey("wwm872RcvN7XwNZBjXLSHfAYrFUATKgkV9v3BewHj5M");
  const splTokenMetadata = await SplTokenMetadata.init(provider);
  const bwum = await createMint(
    provider,
    provider.wallet.publicKey,
    9
  );
  await splTokenMetadata.createMetadata({
    data: new Data({
      name: 'Net bWUM Test',
      symbol: 'nbwum',
      uri: "https://wumbo-token-metadata.s3.us-east-2.amazonaws.com/bwum.json",
      creators: null,
      sellerFeeBasisPoints: 0
    }),
    mint: bwum
  });
  await mintTo(provider, bwum, 80 * Math.pow(10, 9), betaWumDest1);
  await mintTo(provider, bwum, 20 * Math.pow(10, 9), betaWumDest2);

  return bwum;
}

async function run() {
  console.log(process.env.ANCHOR_PROVIDER_URL)
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.getProvider();
  const me = provider.wallet.publicKey;
  

  const tokenBondingSdk = await SplTokenBonding.init(provider);
  await tokenBondingSdk.initializeSolStorage();
  const bwum = new PublicKey("HvdnoodTaRSaB7AEtm7QaDveqW9M3r4hmoNaqTggQkVp");
  console.log(`Using bwum ${bwum.toBase58()}`);

  const wSolAcct = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    NATIVE_MINT,
    me,
    true
  );

  const curve = await tokenBondingSdk.initializeCurve({
    config: new ExponentialCurveConfig({
      c: 0,
      b: 1,
      pow: 0,
      frac: 1
    })
  });
  const { tokenBonding: bonding } = await tokenBondingSdk.createTokenBonding({
    curve,
    baseMint: NATIVE_MINT,
    targetMint: bwum,
    reserveAuthority: me,
    curveAuthority: me,
    buyBaseRoyaltyPercentage: 0,
    buyTargetRoyaltyPercentage: 0,
    sellBaseRoyaltyPercentage: 0,
    sellTargetRoyaltyPercentage: 0,
    index: 1
  });
  console.log(`Created bonding ${bonding.toBase58()}`);

  const wSolBalance = (await provider.connection.getAccountInfo(wSolAcct))!.lamports
  const bondingAcct = (await tokenBondingSdk.getTokenBonding(bonding))!;
  console.log(`Transferring ${wSolBalance} lamports to the reserves`);
  
  const { instructions, signers, output: { destination } } = await tokenBondingSdk.buyBondingWrappedSolInstructions({
    amount: new BN(wSolBalance)
  });
  instructions.unshift(
    Token.createCloseAccountInstruction(
      TOKEN_PROGRAM_ID,
      wSolAcct,
      me,
      me,
      []
    )
  );
  instructions.push(
    Token.createTransferInstruction(
      TOKEN_PROGRAM_ID,
      destination,
      bondingAcct.baseStorage,
      me,
      [],
      wSolBalance
    )
  )
  await tokenBondingSdk.sendInstructions(instructions, signers, me);
  const reservesBalance = (await getTokenAccount(provider, bondingAcct.baseStorage)).amount;
  console.log(`Reserves Balance: ${reservesBalance}`)
}

run().catch(e => {
  console.error(e);
  process.exit(1);
})