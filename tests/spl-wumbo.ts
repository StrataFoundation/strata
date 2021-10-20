import * as anchor from "@wum.bo/anchor";
import { Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
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
import { getMetadata } from "@wum.bo/spl-utils";

use(ChaiAsPromised);

describe("spl-wumbo", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.local());
  const program = anchor.workspace.SplWumbo;
  const provider = anchor.getProvider();

  const tokenUtils = new TokenUtils(provider);
  const splTokenBondingProgram = new SplTokenBonding(provider, anchor.workspace.SplTokenBonding);
  const splTokenStakingProgram = new SplTokenStaking(provider, anchor.workspace.SplTokenStaking);
  const splTokenAccountSplitProgram = new SplTokenAccountSplit(provider, anchor.workspace.SplTokenAccountSplit, splTokenStakingProgram);
  const wumboProgram = new SplWumbo({
    provider,
    program,
    splTokenBondingProgram,
    splTokenStakingProgram,
    splTokenAccountSplitProgram,
  });

  let collective: PublicKey;
  let wumMint: PublicKey;
  let curve: PublicKey;

  before(async () => {
    wumMint = await createMint(
      provider,
      splTokenStakingProgram.wallet.publicKey,
      1
    )
    collective = await wumboProgram.createCollective({
      mint: wumMint,
      authority: splTokenStakingProgram.wallet.publicKey
    });
    curve = await splTokenBondingProgram.initializeCurve({
      curve: {
        // @ts-ignore
        logCurveV0: {
          c: new BN(1000000000000), // 1
          g: new BN(100000000000), // 0.1
          taylorIterations: 15,
        },
      },
    })
  })

  describe("Unclaimed", () => {
    let unclaimedTokenRef: PublicKey;
    let unclaimedReverseTokenRef: PublicKey;
    let name: PublicKey;
    let nameClass = Keypair.generate();
    const tokenName = "test-handle";

    async function create(tokenName: string) {
      const connection = provider.connection;
      const hashedName = await getHashedName(tokenName);
      name = await getNameAccountKey(hashedName, nameClass.publicKey)
      const nameTx = new Transaction({
        recentBlockhash: (await connection.getRecentBlockhash()).blockhash,
        feePayer: provider.wallet.publicKey
      })
      nameTx.instructions.push(
        await createNameRegistry(
          connection,
          tokenName,
          NameRegistryState.HEADER_LEN,
          wumboProgram.wallet.publicKey,
          wumboProgram.wallet.publicKey,
          10000000,
          nameClass.publicKey
        )
      )
      nameTx.partialSign(nameClass);
      await provider.send(nameTx);
      const { tokenRef, reverseTokenRef } = await wumboProgram.createSocialToken({
        collective,
        name,
        nameClass: nameClass.publicKey,
        tokenName,
        curve,
        tokenBondingParams: {
          buyBaseRoyaltyPercentage: percent(10),
          buyTargetRoyaltyPercentage: percent(5),
          sellBaseRoyaltyPercentage: percent(0),
          sellTargetRoyaltyPercentage: percent(0)
        }
      })
      unclaimedTokenRef = tokenRef;
      unclaimedReverseTokenRef = reverseTokenRef;
    }
 
    before(async () => {
      await create(tokenName);
    });

    it("Creates an unclaimed social token", async () => {
      const reverseTokenRef = await wumboProgram.account.tokenRefV0.fetch(unclaimedReverseTokenRef);
      expect(reverseTokenRef.isClaimed).to.be.false;
      // @ts-ignore
      expect(reverseTokenRef.name.toBase58()).to.equal(name.toBase58());
      expect((reverseTokenRef.owner as PublicKey).toBase58()).to.equal(nameClass.publicKey.toBase58());

      const tokenRef = await wumboProgram.account.tokenRefV0.fetch(unclaimedTokenRef);
      expect(tokenRef.isClaimed).to.be.false;
      // @ts-ignore
      expect(tokenRef.name.toBase58()).to.equal(name.toBase58());
      expect((tokenRef.owner as PublicKey).toBase58()).to.equal(nameClass.publicKey.toBase58());
    });

    it("Allows claiming, which by default sets new rewards to my account", async () => {
      const tokenRef = await wumboProgram.account.tokenRefV0.fetch(unclaimedTokenRef);
      const tokenBonding = await splTokenBondingProgram.account.tokenBondingV0.fetch(tokenRef.tokenBonding);
      await tokenUtils.createAtaAndMint(provider, wumMint, 2000000);
      await wumboProgram.claimSocialToken({
        tokenRef: unclaimedTokenRef,
        owner: provider.wallet.publicKey,
        symbol: 'foop'
      });
      await splTokenBondingProgram.buyV0({
        tokenBonding: tokenRef.tokenBonding,
        desiredTargetAmount: new BN(100_000000000),
        slippage: 0.1
      })

      await tokenUtils.expectAtaBalance(wumboProgram.wallet.publicKey, tokenBonding.targetMint, 105.263157875)
    });
  });

  describe("Claimed", () => {
    let claimedTokenRef: PublicKey;
    let claimedReverseTokenRef: PublicKey;
 
    before(async () => {
      // Recreate to keep from conflicts from prev tests
      wumMint = await createMint(
        provider,
        splTokenStakingProgram.wallet.publicKey,
        1
      )
      collective = await wumboProgram.createCollective({
        mint: wumMint,
        isOpen: false,
        authority: splTokenStakingProgram.wallet.publicKey
      });
      const { tokenRef, reverseTokenRef } = await wumboProgram.createSocialToken({
        collective,
        owner: wumboProgram.wallet.publicKey,
        tokenName: 'Whaddup',
        curve,
        tokenBondingParams: {
          buyBaseRoyaltyPercentage: percent(0),
          buyTargetRoyaltyPercentage: percent(0),
          sellBaseRoyaltyPercentage: percent(0),
          sellTargetRoyaltyPercentage: percent(0)
        }
      })
      claimedTokenRef = tokenRef;
      claimedReverseTokenRef = reverseTokenRef;
    });

    it("Creates a claimed social token", async () => {
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
      const tokenMetadataRaw = await provider.connection.getAccountInfo(tokenRef.tokenMetadata);
      const tokenMetadata = decodeMetadata(tokenMetadataRaw!.data);
      expect(tokenMetadata.updateAuthority).to.equal(wumboProgram.wallet.publicKey.toBase58())
    });
  });
});
