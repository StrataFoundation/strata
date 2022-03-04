import * as anchor from "@project-serum/anchor";
import { Keypair } from "@solana/web3.js";
import { expect, use } from "chai";
import ChaiAsPromised from "chai-as-promised";
import {
  MarketplaceSdk
} from "@strata-foundation/marketplace-sdk";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { TokenUtils } from "./utils/token";
import { SplTokenMetadata } from "@strata-foundation/spl-utils";
import { DataV2 } from "@metaplex-foundation/mpl-token-metadata";
import { NATIVE_MINT } from "@solana/spl-token";
import { waitForUnixTime } from "./utils/clock";

use(ChaiAsPromised);

function percent(percent: number): number {
  return Math.floor((percent / 100) * 4294967295); // uint32 max value
}

describe("marketplace-sdk", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.local());
  const provider = anchor.getProvider();

  const program = anchor.workspace.SplTokenBonding;
  const tokenUtils = new TokenUtils(provider);
  const tokenBondingProgram = new SplTokenBonding(provider, program);
  const splTokenMetadata = new SplTokenMetadata({ provider });
  const marketplaceSdk = new MarketplaceSdk(
    provider,
    tokenBondingProgram,
    splTokenMetadata
  );
  const me = tokenBondingProgram.wallet.publicKey;

  before(async () => {
    await tokenBondingProgram.initializeSolStorage({
      mintKeypair: Keypair.generate(),
    });
  });

  it("allows creation of an lbp", async () => {
    const { targetMint, tokenBonding } =
      await marketplaceSdk.createLiquidityBootstrapper({
        authority: me,
        metadata: new DataV2({
          // Max name len 32
          name: "test",
          symbol: "test",
          uri: "",
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null,
        }),
        baseMint: NATIVE_MINT,
        startPrice: 5,
        minPrice: 0.5,
        interval: 2,
        maxSupply: 100,
        bondingArgs: {
          targetMintDecimals: 9,
        },
      });
    const tokenBondingAcct = (await tokenBondingProgram.getTokenBonding(tokenBonding))!
    await waitForUnixTime(
      provider.connection,
      BigInt(tokenBondingAcct.goLiveUnixTime.toNumber() + 2)
    );
    const { targetAmount } = await tokenBondingProgram.swap({
      baseMint: NATIVE_MINT,
      targetMint,
      baseAmount: 1,
      slippage: 0.01
    });
    // Price should shift slightly because k = 1 at this point
    expect(targetAmount).to.eq(1.990098767);
  });
})