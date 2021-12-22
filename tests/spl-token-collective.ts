import {
  createNameRegistry,
  getHashedName,
  getNameAccountKey,
  NameRegistryState,
} from "@bonfida/spl-name-service";
import * as anchor from "@project-serum/anchor";
import { BN } from "@project-serum/anchor";
import { createMint } from "@project-serum/common";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  ExponentialCurveConfig,
  SplTokenBonding,
} from "@strata-foundation/spl-token-bonding";
import {
  decodeMetadata,
  sendMultipleInstructions,
  SplTokenMetadata,
  percent,
} from "@strata-foundation/spl-utils";
import { expect, use } from "chai";
import ChaiAsPromised from "chai-as-promised";
import { SplTokenCollective } from "../packages/spl-token-collective";
import { TokenUtils } from "./utils/token";

use(ChaiAsPromised);

describe("spl-token-collective", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.local());
  const program = anchor.workspace.SplTokenCollective;
  const provider = anchor.getProvider();

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
      mintKeypair: Keypair.generate()
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
      await provider.send(nameTx);
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
      const { instructions, signers } = await tokenCollectiveProgram.optOutInstructions({
        tokenRef: unclaimedTokenRef,
        handle: tokenName
      });
      await tokenCollectiveProgram.sendInstructions(instructions, [...signers, nameClass]);
      const ownerTokenRef = (await tokenCollectiveProgram.getTokenRef(
        unclaimedTokenRef
      ))!;
      const tokenBonding = (await splTokenBondingProgram.getTokenBonding(
        ownerTokenRef.tokenBonding!
      ))!;
      const mintTokenRef = (await tokenCollectiveProgram.getTokenRef(
        (await SplTokenCollective.mintTokenRefKey(tokenBonding.targetMint))[0]
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
      await tokenUtils.createAtaAndMint(provider, wumMint, 2000000);
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
        [signers[0], signers[1], [...signers[2], ownerKeypair]]
      );
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
      const tokenMetadata = decodeMetadata(tokenMetadataRaw!.data);
      expect(tokenMetadata.updateAuthority).to.equal(
        ownerKeypair.publicKey.toBase58()
      );
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
  });
});
