import { MarketplaceSdk } from ".";
import fs from "fs";
import * as anchor from "@project-serum/anchor";
import { Keypair } from "@solana/web3.js";

async function run() {
  console.log(process.env.ANCHOR_PROVIDER_URL);
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.getProvider();
  const curveKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(process.env.CURVE_PATH!).toString())));

  const marketplaceSdk = await MarketplaceSdk.init(provider);
  if (!(await provider.connection.getAccountInfo(curveKeypair.publicKey))) {
    console.log("Creating curve...");
    const curve = await marketplaceSdk.createFixedCurve({
      keypair: curveKeypair,
    });
    console.log("Created curve", curve.toBase58());
  }
}


run().catch((e) => {
  console.error(e);
  process.exit(1);
});
