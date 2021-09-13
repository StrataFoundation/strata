import * as anchor from "@project-serum/anchor";
import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { expect, use } from "chai";
import ChaiAsPromised from "chai-as-promised";
import { SplWumbo } from "../packages/spl-wumbo";
import { SplTokenBonding } from "../packages/spl-token-bonding";
import { PeriodUnit, SplTokenStaking } from "../packages/spl-token-staking";
import { decodeMetadata, percent } from "../packages/spl-utils/src";
import { SplTokenAccountSplit } from "../packages/spl-token-account-split/src";
import { Token } from "@solana/spl-token";
import { TokenUtils } from "./utils/token";
import { createMint } from "@project-serum/common";
import { createNameRegistry, getHashedName, getNameAccountKey, NameRegistryState } from "@solana/spl-name-service";
import { BN } from "@wum.bo/anchor";

use(ChaiAsPromised);

describe("spl-wumbo", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.local());
  const program = anchor.workspace.SplWumbo;

  const tokenUtils = new TokenUtils(program.provider);
  const splTokenBondingProgram = new SplTokenBonding(anchor.workspace.SplTokenBonding);
  const splTokenStakingProgram = new SplTokenStaking(anchor.workspace.SplTokenStaking);
  const splTokenAccountSplitProgram = new SplTokenAccountSplit(anchor.workspace.SplTokenAccountSplit, splTokenStakingProgram);
  const wumboProgram = new SplWumbo({
    program,
    splTokenBondingProgram,
    splTokenStakingProgram,
    splTokenAccountSplitProgram,
  });

  let wumbo: PublicKey;
  let wumMint: PublicKey;

  before(async () => {
    wumMint = await createMint(
      splTokenStakingProgram.provider,
      splTokenStakingProgram.wallet.publicKey,
      1
    )
    wumbo = await wumboProgram.createWumbo({
      wumMint: wumMint 
    });
  })

  it("Initializes Wumbo with sane defaults", async () => {
    let wumboAcct = await wumboProgram.account.wumbo.fetch(wumbo);

    expect(wumboAcct.tokenMetadataDefaults).to.eql({
      symbol: "UNCLAIMED",
      uri: "testtest", // TODO: get proper arweaveUri
    });

    expect({
      ...wumboAcct.tokenBondingDefaults,
      curve: wumboAcct.tokenBondingDefaults.curve.toString(),
    }).to.eql({
      curve: wumboAcct.curve.toString(),
      baseRoyaltyPercentage: percent(5),
      targetRoyaltyPercentage: percent(5),
      targetMintDecimals: 9,
      buyFrozen: false,
    });

    expect(wumboAcct.tokenStakingDefaults).to.eql({
      periodUnit: PeriodUnit.DAY,
      period: 1,
      targetMintDecimals: 9,
      rewardPercentPerPeriodPerLockupPeriod: percent(1),
    });
  });

  describe("Unclaimed", () => {
    let unclaimedTokenRef: PublicKey;
    let unclaimedReverseTokenRef: PublicKey;
    let name: PublicKey;
    const tokenName = "test-handle";
 
    before(async () => {
      const connection = wumboProgram.provider.connection;
      const hashedName = await getHashedName(tokenName);
      name = await getNameAccountKey(hashedName)
      const nameTx = new Transaction({
        recentBlockhash: (await connection.getRecentBlockhash()).blockhash
      })
      nameTx.instructions.push(
        await createNameRegistry(
          connection,
          tokenName,
          NameRegistryState.HEADER_LEN,
          wumboProgram.wallet.publicKey,
          wumboProgram.wallet.publicKey
        )
      )
      await wumboProgram.provider.send(nameTx);
      const { tokenRef, reverseTokenRef } = await wumboProgram.createSocialToken({
        wumbo,
        name,
        tokenName
      })
      unclaimedTokenRef = tokenRef;
      unclaimedReverseTokenRef = reverseTokenRef;
    });

    it("Creates an unclaimed social token", async () => {
      const reverseTokenRef = await wumboProgram.account.tokenRefV0.fetch(unclaimedReverseTokenRef);
      expect(reverseTokenRef.isClaimed).to.be.false;
      // @ts-ignore
      expect(reverseTokenRef.name.toBase58()).to.equal(name.toBase58());
      expect(reverseTokenRef.owner).to.be.null;

      const tokenRef = await wumboProgram.account.tokenRefV0.fetch(unclaimedTokenRef);
      expect(tokenRef.isClaimed).to.be.false;
      // @ts-ignore
      expect(tokenRef.name.toBase58()).to.equal(name.toBase58());
      expect(tokenRef.owner).to.be.null;
    });

    it("Allows claiming, which transfers founder rewards to my ata", async () => {
      const tokenRef = await wumboProgram.account.tokenRefV0.fetch(unclaimedTokenRef);
      const tokenBonding = await splTokenBondingProgram.account.tokenBondingV0.fetch(tokenRef.tokenBonding);
      await tokenUtils.createAtaAndMint(wumboProgram.provider, wumMint, 2000000);
      await splTokenBondingProgram.buyV0({
        tokenBonding: tokenRef.tokenBonding,
        desiredTargetAmount: new BN(100_000000000),
        slippage: 0.1
      })
      await wumboProgram.claimSocialToken({
        tokenRef: unclaimedTokenRef,
        owner: this
      });
      console.log("3")

      await tokenUtils.expectAtaBalance(wumboProgram.wallet.publicKey, tokenBonding.targetMint, 105.263157875)
    })
  });

  describe("Claimed", () => {
    let claimedTokenRef: PublicKey;
    let claimedReverseTokenRef: PublicKey;
 
    before(async () => {
      const { tokenRef, reverseTokenRef } = await wumboProgram.createSocialToken({
        wumbo,
        owner: wumboProgram.wallet.publicKey,
        tokenName: 'Whaddup'
      })
      claimedTokenRef = tokenRef;
      claimedReverseTokenRef = reverseTokenRef;
    });

    it("Creates an unclaimed social token", async () => {
      const reverseTokenRef = await wumboProgram.account.tokenRefV0.fetch(claimedReverseTokenRef);
      expect(reverseTokenRef.isClaimed).to.be.true;
      // @ts-ignore
      expect(reverseTokenRef.owner.toBase58()).to.equal(wumboProgram.wallet.publicKey.toBase58());
      expect(reverseTokenRef.name).to.be.null;

      const tokenRef = await wumboProgram.account.tokenRefV0.fetch(claimedTokenRef);
      expect(tokenRef.isClaimed).to.be.true;
      // @ts-ignore
      expect(tokenRef.owner.toBase58()).to.equal(wumboProgram.wallet.publicKey.toBase58());
      expect(tokenRef.name).to.be.null;
    });

    it("Allows updating metadata", async () => {
      await wumboProgram.updateMetadata({
        tokenRef: claimedTokenRef,
        name: 'foofoo'
      });
      const tokenRef = await wumboProgram.account.tokenRefV0.fetch(claimedTokenRef);
      const tokenMetadataRaw = await wumboProgram.provider.connection.getAccountInfo(tokenRef.tokenMetadata);
      const tokenMetadata = decodeMetadata(tokenMetadataRaw!.data);

      expect(tokenMetadata.data.name).to.equal('foofoo');
    })
  });
});
