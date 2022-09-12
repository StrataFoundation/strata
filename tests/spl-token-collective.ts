import {
  createNameRegistry,
  getHashedName,
  getNameAccountKey,
  NameRegistryState,
} from "@solana/spl-name-service";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import * as anchor from "@project-serum/anchor";
import { AnchorProvider, BN } from "@project-serum/anchor";
import { NATIVE_MINT } from "@solana/spl-token";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  ExponentialCurveConfig,
  SplTokenBonding,
} from "@strata-foundation/spl-token-bonding";
import {
  sendMultipleInstructions,
  SplTokenMetadata,
  percent,
  createMint,
  createAtaAndMint,
} from "@strata-foundation/spl-utils";
import { expect, use } from "chai";
import ChaiAsPromised from "chai-as-promised";
import { SplTokenCollective } from "../packages/spl-token-collective";
import { TokenUtils } from "./utils/token";

use(ChaiAsPromised);

describe("spl-token-collective", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.local("http://127.0.0.1:8899"));
  const provider = anchor.getProvider() as AnchorProvider;
  const program = anchor.workspace.SplTokenCollective;

  const tokenUtils = new TokenUtils(provider);
  const splTokenBondingProgram = new SplTokenBonding(
    provider,
    anchor.workspace.SplTokenBonding
  );
  const tokenCollectiveProgram = new SplTokenCollective({
    provider,
    program,
    splTokenBondingProgram,
    splTokenMetadata: new SplTokenMetadata({ provider }),
  });

  let config = {
    isOpen: false,
    unclaimedTokenBondingSettings: {
      buyBaseRoyalties: {
        ownedByName: true,
      },
      sellBaseRoyalties: {
        ownedByName: true,
      },
      buyTargetRoyalties: {
        ownedByName: true,
      },
      sellTargetRoyalties: {
        ownedByName: true,
      },
    },
    unclaimedTokenMetadataSettings: {
      symbol: "UNCLAIMED",
      uri: "https://wumbo-token-metadata.s3.us-east-2.amazonaws.com/open.json",
      nameIsNameServiceName: true,
    },
  };

  let collective: PublicKey;
  let wumMint: PublicKey;
  let curve: PublicKey;

  before(async () => {
    await splTokenBondingProgram.initializeSolStorage({
      mintKeypair: Keypair.generate(),
    });
    wumMint = await createMint(
      provider,
      tokenCollectiveProgram.wallet.publicKey,
      1
    );
    const { collective: collectiveRet } =
      await tokenCollectiveProgram.createCollective({
        mint: wumMint,
        authority: tokenCollectiveProgram.wallet.publicKey,
        config,
      });
    collective = collectiveRet;
    curve = await splTokenBondingProgram.initializeCurve({
      config: new ExponentialCurveConfig({
        c: 1,
        b: 0,
        pow: 1,
        frac: 1,
      }),
    });
  });

  describe("collective", () => {
    it("allows updating the collective", async () => {
      await tokenCollectiveProgram.updateCollective({
        collective,
        config: {
          ...config,
          isOpen: true,
        },
      });

      const collectiveAcct = (await tokenCollectiveProgram.getCollective(
        collective
      ))!;
      expect(collectiveAcct.config.isOpen).to.be.true;
    });
  });

  describe("Unclaimed", () => {
    let unclaimedTokenRef: PublicKey;
    let unclaimedReverseTokenRef: PublicKey;
    let name: PublicKey;
    let nameClass = Keypair.generate();
    let tokenName = "test-handle";

    async function create(tokenName: string) {
      const connection = provider.connection;
      const hashedName = await getHashedName(tokenName);
      name = await getNameAccountKey(hashedName, nameClass.publicKey);
      const nameTx = new Transaction({
        recentBlockhash: (await connection.getRecentBlockhash()).blockhash,
        feePayer: provider.wallet.publicKey,
      });
      nameTx.instructions.push(
        await createNameRegistry(
          connection,
          tokenName,
          NameRegistryState.HEADER_LEN,
          tokenCollectiveProgram.wallet.publicKey,
          tokenCollectiveProgram.wallet.publicKey,
          10000000,
          nameClass.publicKey
        )
      );
      nameTx.partialSign(nameClass);
      const goLiveDate = new Date(0);
      goLiveDate.setUTCSeconds(1642690800);
      await provider.sendAndConfirm(nameTx);
      const { ownerTokenRef, mintTokenRef } =
        await tokenCollectiveProgram.createSocialToken({
          collective,
          name,
          nameClass: nameClass.publicKey,
          metadata: {
            name: tokenName,
            symbol: tokenName.slice(0, 5),
          },
          tokenBondingParams: {
            curve,
            goLiveDate,
            buyBaseRoyaltyPercentage: 10,
            buyTargetRoyaltyPercentage: 5,
            sellBaseRoyaltyPercentage: 0,
            sellTargetRoyaltyPercentage: 0,
          },
        });
      unclaimedTokenRef = ownerTokenRef;
      unclaimedReverseTokenRef = mintTokenRef;
    }

    before(async () => {
      await create(tokenName);
    });

    it("Creates an unclaimed social token", async () => {
      const mintTokenRef = (await tokenCollectiveProgram.getTokenRef(
        unclaimedReverseTokenRef
      ))!;
      expect(mintTokenRef.isClaimed).to.be.false;
      // @ts-ignore
      expect(mintTokenRef.name.toBase58()).to.equal(name.toBase58());
      expect((mintTokenRef.owner as PublicKey).toBase58()).to.equal(
        nameClass.publicKey.toBase58()
      );

      const ownerTokenRef = (await tokenCollectiveProgram.getTokenRef(
        unclaimedTokenRef
      ))!;
      expect(ownerTokenRef.isClaimed).to.be.false;
      // @ts-ignore
      expect(ownerTokenRef.name.toBase58()).to.equal(name.toBase58());
      expect((ownerTokenRef.owner as PublicKey).toBase58()).to.equal(
        nameClass.publicKey.toBase58()
      );
    });

    it("Allows opting out, which freezes the curve", async () => {
      const { instructions, signers } =
        await tokenCollectiveProgram.optOutInstructions({
          tokenRef: unclaimedTokenRef,
          handle: tokenName,
        });
      await tokenCollectiveProgram.sendInstructions(instructions, [
        ...signers,
        nameClass,
      ]);
      const ownerTokenRef = (await tokenCollectiveProgram.getTokenRef(
        unclaimedTokenRef
      ))!;
      const tokenBonding = (await splTokenBondingProgram.getTokenBonding(
        ownerTokenRef.tokenBonding!
      ))!;
      const mintTokenRef = (await tokenCollectiveProgram.getTokenRef(
        (
          await SplTokenCollective.mintTokenRefKey(tokenBonding.targetMint)
        )[0]
      ))!;
      expect(tokenBonding.buyFrozen).to.be.true;
      expect(ownerTokenRef.isOptedOut).to.be.true;
      expect(mintTokenRef.isOptedOut).to.be.true;
    });

    it("Allows claiming, which by default sets new rewards to my account and transfers rewards from any accounts with owned_by_name", async () => {
      tokenName = "claim-test";
      await create(tokenName);
      const ownerTokenRef = (await tokenCollectiveProgram.getTokenRef(
        unclaimedTokenRef
      ))!;
      const tokenBonding = (await splTokenBondingProgram.getTokenBonding(
        ownerTokenRef.tokenBonding!
      ))!;
      await createAtaAndMint(provider, wumMint, 2000000);
      await splTokenBondingProgram.buy({
        tokenBonding: ownerTokenRef.tokenBonding!,
        desiredTargetAmount: new BN(100_000000000),
        slippage: 0.1,
      });
      await tokenCollectiveProgram.claimSocialToken({
        tokenRef: unclaimedTokenRef,
        owner: provider.wallet.publicKey,
        symbol: "foop",
        isPrimary: false,
      });
      await splTokenBondingProgram.buy({
        tokenBonding: ownerTokenRef.tokenBonding!,
        desiredTargetAmount: new BN(100_000000000),
        slippage: 0.1,
      });

      await tokenUtils.expectAtaBalance(
        tokenCollectiveProgram.wallet.publicKey,
        tokenBonding.targetMint,
        210.52631575
      );
    });
  });

  it("should allow creating a social token with no collective", async () => {
    const keypair = Keypair.generate();
    const { instructions, signers } =
      await tokenCollectiveProgram.createSocialTokenInstructions({
        owner: keypair.publicKey,
        mint: NATIVE_MINT,
        authority: keypair.publicKey,
        metadata: {
          name: "Whaddup",
          symbol: "WHAD",
          uri: "https://wumbo-token-metadata.s3.us-east-2.amazonaws.com/open.json",
        },
        tokenBondingParams: {
          curve,
          buyBaseRoyaltyPercentage: 0,
          buyTargetRoyaltyPercentage: 0,
          sellBaseRoyaltyPercentage: 0,
          sellTargetRoyaltyPercentage: 0,
        },
      });
    await sendMultipleInstructions(
      tokenCollectiveProgram.errors || new Map(),
      provider,
      instructions,
      [signers[0], signers[1], [...signers[2], keypair]]
    );
  });

  describe("Claimed", () => {
    let claimedTokenRef: PublicKey;
    let claimedReverseTokenRef: PublicKey;
    let ownerKeypair: Keypair = Keypair.generate();
    let owner: PublicKey = ownerKeypair.publicKey;

    before(async () => {
      // Recreate to keep from conflicts from prev tests
      wumMint = await createMint(
        provider,
        tokenCollectiveProgram.wallet.publicKey,
        1
      );
      const { collective: collectiveRet } =
        await tokenCollectiveProgram.createCollective({
          mint: wumMint,
          authority: tokenCollectiveProgram.wallet.publicKey,
          config,
        });
      collective = collectiveRet;
      const goLiveDate = new Date(0);
      goLiveDate.setUTCSeconds(1642690800);
      const {
        output: { ownerTokenRef, mintTokenRef },
        instructions,
        signers,
      } = await tokenCollectiveProgram.createSocialTokenInstructions({
        collective,
        owner,
        authority: provider.wallet.publicKey,
        metadata: {
          name: "Whaddup",
          symbol: "WHAD",
        },
        tokenBondingParams: {
          goLiveDate,
          curve,
          buyBaseRoyaltyPercentage: 0,
          buyTargetRoyaltyPercentage: 0,
          sellBaseRoyaltyPercentage: 0,
          sellTargetRoyaltyPercentage: 0,
        },
      });
      claimedTokenRef = ownerTokenRef;
      claimedReverseTokenRef = mintTokenRef;
      await sendMultipleInstructions(
        tokenCollectiveProgram.errors || new Map(),
        provider,
        instructions,
        [signers[0], signers[1], [...signers[2], ownerKeypair]],
        provider.wallet.publicKey
      );
    });

    it("allows creating a collective on a social token", async () => {
      const mintTokenRef = (await tokenCollectiveProgram.getTokenRef(
        claimedReverseTokenRef
      ))!;
      await tokenCollectiveProgram.createCollective({
        mint: mintTokenRef.mint,
        authority: tokenCollectiveProgram.wallet.publicKey,
        config,
        tokenRef: mintTokenRef.publicKey,
      });
    });

    it("Creates a claimed social token", async () => {
      const mintTokenRef = (await tokenCollectiveProgram.getTokenRef(
        claimedReverseTokenRef
      ))!;
      expect(mintTokenRef.isClaimed).to.be.true;
      // @ts-ignore
      expect(mintTokenRef.owner.toBase58()).to.equal(
        ownerKeypair.publicKey.toBase58()
      );
      expect(mintTokenRef.name).to.be.null;

      const ownerTokenRef = (await tokenCollectiveProgram.getTokenRef(
        claimedTokenRef
      ))!;
      expect(ownerTokenRef.isClaimed).to.be.true;
      // @ts-ignore
      expect(ownerTokenRef.owner.toBase58()).to.equal(
        ownerKeypair.publicKey.toBase58()
      );
      expect(ownerTokenRef.name).to.be.null;
      const tokenMetadataRaw = await provider.connection.getAccountInfo(
        ownerTokenRef.tokenMetadata
      );
      const tokenMetadata = new Metadata(
        ownerTokenRef.tokenMetadata,
        tokenMetadataRaw!
      ).data;
      expect(tokenMetadata.updateAuthority).to.equal(
        ownerKeypair.publicKey.toBase58()
      );
    });

    it("Allows updating token bonding curve", async () => {
      const mintTokenRef = (await tokenCollectiveProgram.getTokenRef(
        claimedReverseTokenRef
      ))!;

      const newCurve = await splTokenBondingProgram.initializeCurve({
        config: new ExponentialCurveConfig({
          c: 0,
          pow: 0,
          frac: 1,
          b: 1,
        }),
      });

      await tokenCollectiveProgram.updateCurve({
        tokenRef: mintTokenRef.publicKey,
        curve: newCurve,
      });

      let newTokenBonding = (await splTokenBondingProgram.getTokenBonding(
        mintTokenRef.tokenBonding!
      ))!;
      const c = await splTokenBondingProgram.getCurve(newTokenBonding?.curve);
      curve = c!.publicKey
      const curveConfig =
        // @ts-ignore
        c?.definition?.timeV0?.curves[0]?.curve?.exponentialCurveV0;
      expect(curveConfig.c.toNumber()).to.equal(0);
      expect(curveConfig.pow).to.equal(0);
      expect(curveConfig.frac).to.equal(1);
      expect(curveConfig.b.toNumber()).to.equal(1000000000000);
    });

    it("Allows updating token bonding", async () => {
      const mintTokenRef = (await tokenCollectiveProgram.getTokenRef(
        claimedReverseTokenRef
      ))!;

      let tokenBondingNow = (await splTokenBondingProgram.getTokenBonding(
        mintTokenRef.tokenBonding!
      ))!;

      expect(tokenBondingNow.buyTargetRoyaltyPercentage).to.equal(percent(0));
      expect(tokenBondingNow.buyBaseRoyaltyPercentage).to.equal(percent(0));
      expect(tokenBondingNow.sellTargetRoyaltyPercentage).to.equal(percent(0));
      expect(tokenBondingNow.sellBaseRoyaltyPercentage).to.equal(percent(0));
      expect(tokenBondingNow.buyFrozen).to.equal(false);

      await tokenCollectiveProgram.updateTokenBonding({
        tokenRef: mintTokenRef.publicKey,
        buyTargetRoyaltyPercentage: 10,
        buyBaseRoyaltyPercentage: 5,
        sellBaseRoyaltyPercentage: 10,
        sellTargetRoyaltyPercentage: 5,
        buyFrozen: true,
      });

      tokenBondingNow = (await splTokenBondingProgram.getTokenBonding(
        mintTokenRef.tokenBonding!
      ))!;

      expect(tokenBondingNow.buyTargetRoyaltyPercentage).to.equal(percent(10));
      expect(tokenBondingNow.buyBaseRoyaltyPercentage).to.equal(percent(5));
      expect(tokenBondingNow.sellBaseRoyaltyPercentage).to.equal(percent(10));
      expect(tokenBondingNow.sellTargetRoyaltyPercentage).to.equal(percent(5));
      expect(tokenBondingNow.buyFrozen).to.equal(true);
    });

    it("Allows opting out, which freezes the curve", async () => {
      const { instructions, signers } =
        await tokenCollectiveProgram.optOutInstructions({
          tokenRef: claimedTokenRef,
        });
      await tokenCollectiveProgram.sendInstructions(instructions, [
        ...signers,
        ownerKeypair,
      ]);
      const ownerTokenRef = (await tokenCollectiveProgram.getTokenRef(
        claimedTokenRef
      ))!;
      const tokenBonding = (await splTokenBondingProgram.getTokenBonding(
        ownerTokenRef.tokenBonding!
      ))!;
      const mintTokenRef = (await tokenCollectiveProgram.getTokenRef(
        (
          await SplTokenCollective.mintTokenRefKey(tokenBonding.targetMint)
        )[0]
      ))!;
      expect(tokenBonding.buyFrozen).to.be.true;
      expect(ownerTokenRef.isOptedOut).to.be.true;
      expect(mintTokenRef.isOptedOut).to.be.true;
    });

    // This is a bounties use case
    it("Allows claiming authority over bonding curves owned by the mint token ref with social token mint as the base token", async () => {
      const tokenRef = (await tokenCollectiveProgram.getTokenRef(
        claimedReverseTokenRef
      ))!;
      const { tokenBonding } = await splTokenBondingProgram.createTokenBonding({
        baseMint: tokenRef.mint,
        targetMintDecimals: 0,
        buyBaseRoyaltyPercentage: 0,
        buyTargetRoyaltyPercentage: 0,
        sellBaseRoyaltyPercentage: 0,
        sellTargetRoyaltyPercentage: 0,
        curve,
        generalAuthority: claimedReverseTokenRef,
        reserveAuthority: claimedReverseTokenRef,
      });

      await tokenCollectiveProgram.claimBondingAuthority({
        tokenBonding,
      });
      const tokenRefAuthority = tokenRef.authority?.toBase58();
      const tokenBondingAcct = (await splTokenBondingProgram.getTokenBonding(
        tokenBonding
      ))!;
      expect(
        (tokenBondingAcct.generalAuthority! as PublicKey).toBase58()
      ).to.eq(tokenRefAuthority);
      expect(
        (tokenBondingAcct.generalAuthority! as PublicKey).toBase58()
      ).to.eq(tokenRefAuthority);
    });

    it("Allows changing the authority", async () => {
      await tokenCollectiveProgram.updateAuthority({
        tokenRef: claimedTokenRef,
        newAuthority: ownerKeypair.publicKey,
      });
      const ownerTokenRef = (await tokenCollectiveProgram.getTokenRef(
        claimedTokenRef
      ))!;
      const mintTokenRef = (await tokenCollectiveProgram.getTokenRef(
        (
          await SplTokenCollective.mintTokenRefKey(ownerTokenRef.mint)
        )[0]
      ))!;
      expect((ownerTokenRef.authority! as PublicKey).toBase58()).to.eq(
        ownerKeypair.publicKey.toBase58()
      );
      expect((mintTokenRef.authority! as PublicKey).toBase58()).to.eq(
        ownerKeypair.publicKey.toBase58()
      );
    });

    it("Allows changing the owner", async () => {
      const {
        instructions,
        signers,
        output: { ownerTokenRef },
      } = await tokenCollectiveProgram.updateOwnerInstructions({
        tokenRef: claimedTokenRef,
        newOwner: provider.wallet.publicKey,
      });
      await tokenCollectiveProgram.sendInstructions(instructions, [
        ...signers,
        ownerKeypair,
      ]);
      const oldOwnerTokenRef = (await tokenCollectiveProgram.getTokenRef(
        claimedTokenRef
      ))!;
      expect(oldOwnerTokenRef).to.be.null;
      const newOwnerTokenRef = (await tokenCollectiveProgram.getTokenRef(
        ownerTokenRef
      ))!;
      const mintTokenRef = (await tokenCollectiveProgram.getTokenRef(
        (
          await SplTokenCollective.mintTokenRefKey(newOwnerTokenRef.mint)
        )[0]
      ))!;
      const primaryTokenRef = (await tokenCollectiveProgram.getTokenRef(
        (
          await SplTokenCollective.ownerTokenRefKey({
            isPrimary: true,
            owner: provider.wallet.publicKey,
          })
        )[0]
      ))!;
      expect(newOwnerTokenRef.owner!.toBase58()).to.eq(
        provider.wallet.publicKey.toBase58()
      );
      expect(mintTokenRef.owner!.toBase58()).to.eq(
        provider.wallet.publicKey.toBase58()
      );
      expect(primaryTokenRef.owner!.toBase58()).to.eq(
        provider.wallet.publicKey.toBase58()
      );
    });
  });
});
