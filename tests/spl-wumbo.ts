import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { createMint } from "@project-serum/common";
import { NATIVE_MINT } from "@solana/spl-token";
import { BN } from "@wum.bo/anchor";
import { expect, use } from "chai";
import ChaiAsPromised from "chai-as-promised";
import { SplWumbo, Wumbo } from "../packages/spl-wumbo";
import { SplTokenBonding, TokenBondingV0 } from "../packages/spl-token-bonding/dist/lib";
import { PeriodUnit, SplTokenStaking } from "../packages/spl-token-staking/dist/lib";
import { publicKey } from "../deps/metaplex/js/packages/common/src/utils/layout";

use(ChaiAsPromised);

describe("spl-wumbo", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.local());
  const program = anchor.workspace.SplWumbo;

  const tokenBondingProgram = new SplTokenBonding(anchor.workspace.SplTokenBonding);
  const tokenStakingProgram = new SplTokenStaking(anchor.workspace.SplTokenStaking);
  const wumboProgram = new SplWumbo(program, tokenBondingProgram, tokenStakingProgram);

  it("Initializes Wumbo with sane defaults", async () => {
    let wumbo = await wumboProgram.createWumbo();
    let wumboAcct = await wumboProgram.account.wumbo.fetch(wumbo);

    expect(wumboAcct).to.exist;
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
