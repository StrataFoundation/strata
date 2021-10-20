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

  let wumbo: PublicKey;
  let wumMint: PublicKey;

  before(async () => {
    wumMint = await createMint(
      provider,
      splTokenStakingProgram.wallet.publicKey,
      1
    )
    wumbo = await wumboProgram.createWumbo({
      wumMint: wumMint 
    });
  })

  it("Initializes Wumbo with sane defaults", async () => {
    let wumboAcct = await wumboProgram.account.wumboV0.fetch(wumbo);

    expect(wumboAcct.tokenMetadataDefaults).to.eql({
      symbol: "UNCLAIMED",
      uri: "https://wumbo-token-metadata.s3.us-east-2.amazonaws.com/unclaimed.json", // TODO: get proper arweaveUri
    });

    expect({
      ...wumboAcct.tokenBondingDefaults,
      curve: wumboAcct.tokenBondingDefaults.curve.toString(),
    }).to.eql({
      curve: wumboAcct.curve.toString(),
      buyBaseRoyaltyPercentage: percent(5),
      buyTargetRoyaltyPercentage: percent(5),
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
        wumbo,
        name,
        nameClass: nameClass.publicKey,
        tokenName
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


    it("Allows initializing staking", async () => {
      await wumboProgram.initializeStaking({
        tokenRef: unclaimedTokenRef
      })
      const tokenRef = await wumboProgram.account.tokenRefV0.fetch(unclaimedTokenRef);
      expect(tokenRef.tokenStaking).to.not.be.null;
    });

    it("Allows claiming, which transfers founder rewards to my ata", async () => {
      const tokenRef = await wumboProgram.account.tokenRefV0.fetch(unclaimedTokenRef);
      const tokenBonding = await splTokenBondingProgram.account.tokenBondingV0.fetch(tokenRef.tokenBonding);
      await tokenUtils.createAtaAndMint(provider, wumMint, 2000000);
      await splTokenBondingProgram.buyV0({
        tokenBonding: tokenRef.tokenBonding,
        desiredTargetAmount: new BN(100_000000000),
        slippage: 0.1
      })
      await wumboProgram.claimSocialToken({
        tokenRef: unclaimedTokenRef,
        owner: provider.wallet.publicKey,
        symbol: 'foop'
      });

      await tokenUtils.expectAtaBalance(wumboProgram.wallet.publicKey, tokenBonding.targetMint, 105.263157875)
    });

    it("Allows opting out", async () => {
      await create(tokenName + "optout"); // Need to do this because the above claimed it
      const tokenRef = await wumboProgram.account.tokenRefV0.fetch(unclaimedTokenRef);
      await wumboProgram.optOut({
        tokenRef: unclaimedTokenRef,
        nameClass: nameClass.publicKey
      });
      const tokenBonding = await splTokenBondingProgram.account.tokenBondingV0.fetch(tokenRef.tokenBonding);
      expect(tokenBonding.buyFrozen).to.be.true;
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
      wumbo = await wumboProgram.createWumbo({
        wumMint: wumMint
      });
      const { tokenRef, reverseTokenRef } = await wumboProgram.createSocialToken({
        wumbo,
        owner: wumboProgram.wallet.publicKey,
        tokenName: 'Whaddup'
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
    });

    it("Allows opting out", async () => {
      const tokenRef = await wumboProgram.account.tokenRefV0.fetch(claimedTokenRef);
      await wumboProgram.optOut({
        tokenRef: claimedTokenRef
      })
      const tokenBonding = await splTokenBondingProgram.account.tokenBondingV0.fetch(tokenRef.tokenBonding)
      expect(tokenBonding.buyFrozen).to.be.true;
    });

    it("Allows initializing staking", async () => {
      await wumboProgram.initializeStaking({
        tokenRef: claimedTokenRef
      })
      const tokenRef = await wumboProgram.account.tokenRefV0.fetch(claimedTokenRef);
      expect(tokenRef.tokenStaking).to.not.be.null;
    });
    
    it("Allows updating metadata", async () => {
      await wumboProgram.updateMetadata({
        tokenRef: claimedTokenRef,
        name: 'foofoo',
        symbol: 'FOO',
        buyBaseRoyaltyPercentage: percent(10),
        buyTargetRoyaltyPercentage: percent(15)
      });
      const tokenRef = await wumboProgram.account.tokenRefV0.fetch(claimedTokenRef);
      const tokenMetadataRaw = await provider.connection.getAccountInfo(tokenRef.tokenMetadata);
      const tokenStaking = await splTokenStakingProgram.account.tokenStakingV0.fetch(tokenRef.tokenStaking as PublicKey);
      const tokenStakingMetadataKey = await getMetadata(tokenStaking.targetMint.toBase58());
      const tokenMetadata = decodeMetadata(tokenMetadataRaw!.data);
      const tokenStakingMetadataRaw = await provider.connection.getAccountInfo(new PublicKey(tokenStakingMetadataKey));
      const tokenStakingMetadata = decodeMetadata(tokenStakingMetadataRaw.data);
      const bonding = await splTokenBondingProgram.account.tokenBondingV0.fetch(tokenRef.tokenBonding);

      expect(tokenMetadata.data.name).to.equal('foofoo');
      expect(tokenStakingMetadata.data.name).to.equal('foofoo Cred');
      expect(tokenStakingMetadata.data.symbol).to.equal('cFOO');
      expect(bonding.buyBaseRoyaltyPercentage).to.equal(percent(10));
      expect(bonding.buyTargetRoyaltyPercentage).to.equal(percent(15));
    })
  });
});
