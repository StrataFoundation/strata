import { createNameRegistry, getHashedName, getNameAccountKey, NameRegistryState } from "@bonfida/spl-name-service";
import * as anchor from "@project-serum/anchor";
import { BN } from "@project-serum/anchor";
import { createMint } from "@project-serum/common";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { ExponentialCurveConfig, SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { decodeMetadata, sendMultipleInstructions, SplTokenMetadata } from "@strata-foundation/spl-utils";
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
  const splTokenBondingProgram = new SplTokenBonding(provider, anchor.workspace.SplTokenBonding);
  const tokenCollectiveProgram = new SplTokenCollective({
    provider,
    program,
    splTokenBondingProgram,
    splTokenMetadata: new SplTokenMetadata({ provider })
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
      nameIsNameServiceName: true
    }
  }

  let collective: PublicKey;
  let wumMint: PublicKey;
  let curve: PublicKey;

  before(async () => {
    await splTokenBondingProgram.initializeSolStorage();
    wumMint = await createMint(
      provider,
      tokenCollectiveProgram.wallet.publicKey,
      1
    )
    const { collective: collectiveRet } = await tokenCollectiveProgram.createCollective({
      mint: wumMint,
      authority: tokenCollectiveProgram.wallet.publicKey,
      config
    });
    collective = collectiveRet;
    curve = await splTokenBondingProgram.initializeCurve({
      config: new ExponentialCurveConfig({
        c: 1,
        b: 0,
        pow: 1,
        frac: 1
      })
    })
  })

  describe("collective", () => {
    it("allows updating the collective", async () => {
      await tokenCollectiveProgram.updateCollective({
        collective,
        config: {
          ...config,
          isOpen: true
        }
      })

      const collectiveAcct = await tokenCollectiveProgram.account.collectiveV0.fetch(collective);
      expect(collectiveAcct.config.isOpen).to.be.true;
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
          tokenCollectiveProgram.wallet.publicKey,
          tokenCollectiveProgram.wallet.publicKey,
          10000000,
          nameClass.publicKey
        )
      )
      nameTx.partialSign(nameClass);
      await provider.send(nameTx);
      const { tokenRef, reverseTokenRef } = await tokenCollectiveProgram.createSocialToken({
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
          sellTargetRoyaltyPercentage: 0
        }
      })
      unclaimedTokenRef = tokenRef;
      unclaimedReverseTokenRef = reverseTokenRef;
    }
 
    before(async () => {
      await create(tokenName);
    });

    it("Creates an unclaimed social token", async () => {
      const reverseTokenRef = await tokenCollectiveProgram.account.tokenRefV0.fetch(unclaimedReverseTokenRef);
      expect(reverseTokenRef.isClaimed).to.be.false;
      // @ts-ignore
      expect(reverseTokenRef.name.toBase58()).to.equal(name.toBase58());
      expect((reverseTokenRef.owner as PublicKey).toBase58()).to.equal(nameClass.publicKey.toBase58());

      const tokenRef = await tokenCollectiveProgram.account.tokenRefV0.fetch(unclaimedTokenRef);
      expect(tokenRef.isClaimed).to.be.false;
      // @ts-ignore
      expect(tokenRef.name.toBase58()).to.equal(name.toBase58());
      expect((tokenRef.owner as PublicKey).toBase58()).to.equal(nameClass.publicKey.toBase58());
    });

    it("Allows claiming, which by default sets new rewards to my account and transfers rewards from any accounts with owned_by_name", async () => {
      const tokenRef = await tokenCollectiveProgram.account.tokenRefV0.fetch(unclaimedTokenRef);
      const tokenBonding = await splTokenBondingProgram.account.tokenBondingV0.fetch(tokenRef.tokenBonding);
      await tokenUtils.createAtaAndMint(provider, wumMint, 2000000);
      await splTokenBondingProgram.buy({
        tokenBonding: tokenRef.tokenBonding,
        desiredTargetAmount: new BN(100_000000000),
        slippage: 0.1
      })
      await tokenCollectiveProgram.claimSocialToken({
        tokenRef: unclaimedTokenRef,
        owner: provider.wallet.publicKey,
        symbol: 'foop',
        isPrimary: false
      });
      await splTokenBondingProgram.buy({
        tokenBonding: tokenRef.tokenBonding,
        desiredTargetAmount: new BN(100_000000000),
        slippage: 0.1
      })

      await tokenUtils.expectAtaBalance(tokenCollectiveProgram.wallet.publicKey, tokenBonding.targetMint, 210.52631575)
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
      )
      const { collective: collectiveRet } = await tokenCollectiveProgram.createCollective({
        mint: wumMint,
        authority: tokenCollectiveProgram.wallet.publicKey,
        config
      });
      collective = collectiveRet;
      const { output: { tokenRef, reverseTokenRef }, instructions, signers } = await tokenCollectiveProgram.createSocialTokenInstructions({
        collective,
        owner,
        metadata: {
          name: "Whaddup",
          symbol: "WHAD",
        },
        tokenBondingParams: {
          curve,
          buyBaseRoyaltyPercentage: 0,
          buyTargetRoyaltyPercentage: 0,
          sellBaseRoyaltyPercentage: 0,
          sellTargetRoyaltyPercentage: 0
        }
      })
      claimedTokenRef = tokenRef;
      claimedReverseTokenRef = reverseTokenRef;
      await sendMultipleInstructions(
        tokenCollectiveProgram.errors || new Map(),
        provider,
        instructions,
        [signers[0], signers[1], [...signers[2], ownerKeypair]]
      )
    });

    it("Creates a claimed social token", async () => {
      const reverseTokenRef = await tokenCollectiveProgram.account.tokenRefV0.fetch(claimedReverseTokenRef);
      expect(reverseTokenRef.isClaimed).to.be.true;
      // @ts-ignore
      expect(reverseTokenRef.owner.toBase58()).to.equal(ownerKeypair.publicKey.toBase58());
      expect(reverseTokenRef.name).to.be.null;

      const tokenRef = await tokenCollectiveProgram.account.tokenRefV0.fetch(claimedTokenRef);
      expect(tokenRef.isClaimed).to.be.true;
      // @ts-ignore
      expect(tokenRef.owner.toBase58()).to.equal(ownerKeypair.publicKey.toBase58());
      expect(tokenRef.name).to.be.null;
      const tokenMetadataRaw = await provider.connection.getAccountInfo(tokenRef.tokenMetadata);
      const tokenMetadata = decodeMetadata(tokenMetadataRaw!.data);
      expect(tokenMetadata.updateAuthority).to.equal(ownerKeypair.publicKey.toBase58())
    });
  });
});
