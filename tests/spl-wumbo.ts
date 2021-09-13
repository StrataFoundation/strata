import * as anchor from "@project-serum/anchor";
import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { expect, use } from "chai";
import ChaiAsPromised from "chai-as-promised";
import { SplWumbo } from "../packages/spl-wumbo";
import { SplTokenBonding } from "../packages/spl-token-bonding";
import { PeriodUnit, SplTokenStaking } from "../packages/spl-token-staking";
import { percent } from "../packages/spl-utils/src";
import { SplTokenAccountSplit } from "../packages/spl-token-account-split/src";
import { Token } from "@solana/spl-token";
import { TokenUtils } from "./utils/token";
import { createMint } from "@project-serum/common";
import { createNameRegistry, getHashedName, getNameAccountKey, NameRegistryState } from "@solana/spl-name-service";

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

  beforeEach(async () => {
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
 
    beforeEach(async () => {
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
  });

  describe("Claimed", () => {
    let claimedTokenRef: PublicKey;
    let claimedReverseTokenRef: PublicKey;
 
    beforeEach(async () => {
      const connection = wumboProgram.provider.connection;
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
  });

  /* describe("Unclaimed Token", () => {
  *   let socialTokenBonding: PublicKey;
  *   let socialTokenStaking: PublicKey;

  *   before(async () => {
  *     socialTokenBonding = await tokenBondingProgram.createTokenBonding({
  *       authority: wumbo,
  *       curve: baseCurve,
  *       baseMint: tokenBondingAcct.targetMint,
  *       targetMintDecimals: 2,
  *       baseRoyaltyPercentage: percent(0),
  *       targetRoyaltyPercentage: percent(5),
  *       mintCap: new BN(1000),
  *     });

  *     socialTokenStaking = await tokenStakingProgram.createTokenStaking({
  *       authority: wumbo,
  *       baseMint: tokenBondingAcct.targetMint,
  *       periodUnit: PeriodUnit.SECOND,
  *       period: 5,
  *       targetMintDecimals: 2,
  *       rewardPercentPerPeriodPerLockupPeriod: 4294967295, // 100%
  *     });
  *   });

  *   it("Creates a unclaimed social token", async () => {
  *     let { tokenRef, reverseTokenRefBonding, reverseTokenRefStaking } =
  *       await wumboProgram.createSocialToken({
  *         wumbo,
  *         tokenBonding: socialTokenBonding,
  *         tokenStaking: socialTokenStaking,
  *         // nameServiceName:
  *         name: "TeamWumbo",
  *       });

  *     expect(tokenRef).to.exist;
  *     expect(reverseTokenRefBonding).to.exist;
  *     expect(reverseTokenRefStaking).to.exist;
  *   });
  * }); */

  /* describe("Claimed Token", () => {
  *   let socialTokenBonding: PublicKey;
  *   let socialTokenStaking: PublicKey;

  *   before(async () => {
  *     socialTokenBonding = await tokenBondingProgram.createTokenBonding({
  *       authority: wumbo,
  *       curve: baseCurve,
  *       baseMint: tokenBondingAcct.targetMint,
  *       targetMintDecimals: 2,
  *       baseRoyaltyPercentage: percent(0),
  *       targetRoyaltyPercentage: percent(5),
  *       mintCap: new BN(1000),
  *     });

  *     socialTokenStaking = await tokenStakingProgram.createTokenStaking({
  *       authority: wumbo,
  *       baseMint: tokenBondingAcct.targetMint,
  *       periodUnit: PeriodUnit.SECOND,
  *       period: 5,
  *       targetMintDecimals: 2,
  *       rewardPercentPerPeriodPerLockupPeriod: 4294967295, // 100%
  *     });
  *   });

  *   it("Creates a claimed social token", async () => {
  *     let { tokenRef, reverseTokenRefBonding, reverseTokenRefStaking, founderRewardsAccount } =
  *       await wumboProgram.createSocialToken({
  *         wumbo,
  *         tokenBonding: socialTokenBonding,
  *         tokenStaking: socialTokenStaking,
  *         name: "TeamWumbo",
  *       });

  *     expect(tokenRef).to.exist;
  *     expect(reverseTokenRefBonding).to.exist;
  *     expect(reverseTokenRefStaking).to.exist;
  *     expect(founderRewardsAccount).to.exist;
  *   });
  * }); */
});
