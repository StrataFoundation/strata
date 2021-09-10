import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { expect, use } from "chai";
import ChaiAsPromised from "chai-as-promised";
import { SplWumbo } from "../packages/spl-wumbo";
import { SplTokenBonding } from "../packages/spl-token-bonding";
import { PeriodUnit, SplTokenStaking } from "../packages/spl-token-staking";
import { percent } from "../packages/spl-utils/src";

use(ChaiAsPromised);

describe("spl-wumbo", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.local());
  const program = anchor.workspace.SplWumbo;

  const splTokenBondingProgram = new SplTokenBonding(anchor.workspace.SplTokenBonding);
  const splTokenStakingProgram = new SplTokenStaking(anchor.workspace.SplTokenStaking);
  const wumboProgram = new SplWumbo({
    program,
    splTokenBondingProgram,
    splTokenStakingProgram,
    splNameServiceNameClass: anchor.web3.Keypair.generate().publicKey, // TODO: fix this
    splNameServiceNameParent: new anchor.web3.PublicKey("WumboTwitterTdl"),
  });

  let wumbo: PublicKey;

  it("Initializes Wumbo with sane defaults", async () => {
    wumbo = await wumboProgram.createWumbo();
    let wumboAcct = await wumboProgram.account.wumbo.fetch(wumbo);

    expect(wumboAcct.tokenMetadataDefaults).to.eql({
      symbol: "UN",
      name: "UNCLAIMED",
      arweaveUri: "testtest", // TODO: get proper arweaveUri
    });

    expect({
      ...wumboAcct.tokenBondingDefaults,
      curve: wumboAcct.tokenBondingDefaults.curve.toString(),
    }).to.eql({
      curve: wumboAcct.curve.toString(),
      baseRoyaltyPercentage: percent(0),
      targetRoyaltyPercentage: percent(10),
      targetMintDecimals: 9,
      buyFrozen: false,
    });

    expect(wumboAcct.tokenStakingDefaults).to.eql({
      periodUnit: PeriodUnit.SECOND,
      period: 5,
      targetMintDecimals: 9,
      rewardPercentPerPeriodPerLockupPeriod: 4294967295, // 100%
    });
  });

  describe("Unclaied Social Token", () => {
    it("Creates a unclaimed social token", async () => {});
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
