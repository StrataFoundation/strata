import * as anchor from "@project-serum/anchor";
import { BN } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { expect, use } from "chai";
import ChaiAsPromised from "chai-as-promised";
import { createMint } from "@strata-foundation/spl-utils";
import {
  FungibleEntangler,
  FungibleEntanglerV0,
  IFungibleEntangler,
  FungibleChildEntanglerV0,
  IFungibleChildEntangler,
} from "../packages/fungible-entangler/src";
import { waitForUnixTime } from "./utils/clock";
import { TokenUtils } from "./utils/token";

use(ChaiAsPromised);

describe("fungible-entangler", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.local());
  const provider = anchor.getProvider();

  const program = anchor.workspace.FungibleEntangler;
  const tokenUtils = new TokenUtils(provider);
  const fungibleEntanglerProgram = new FungibleEntangler(provider, program);
  const me = fungibleEntanglerProgram.wallet.publicKey;

  describe("initialization", () => {
    let parentMint: PublicKey;
    let entangler: PublicKey;
    let entanglerAcct: IFungibleEntangler;
    const INITIAL_BALANCE = 1000;
    const dynamicSeed = Keypair.generate().publicKey;

    beforeEach(async () => {
      parentMint = await createMint(provider, me, 0);
      await tokenUtils.createAtaAndMint(provider, parentMint, INITIAL_BALANCE);

      const { entangler: entanglerOut } =
        await fungibleEntanglerProgram.createFungibleParentEntangler({
          authority: me,
          mint: parentMint,
          amount: INITIAL_BALANCE,
          dynamicSeed: dynamicSeed.toBuffer(),
        });

      entangler = entanglerOut;
      entanglerAcct = (await fungibleEntanglerProgram.getEntangler(entangler))!;
    });

    it("succesfully creates the parent entangler", async () => {
      await tokenUtils.expectBalance(entanglerAcct.storage, INITIAL_BALANCE);
      await tokenUtils.expectAtaBalance(me, entanglerAcct.mint, 0);
    });

    it("allows creation of a child entangler", async () => {
      // TODO: implement
      expect(false).to.eq(true);
    });

    it("allows creation of both a parent and child entangler", async () => {
      // TODO: implement
      expect(false).to.eq(true);
    });
  });

  describe("swapping", () => {
    it("swaps from the parent to a child", () => {
      // TODO: implement
      expect(false).to.eq(true);
    });

    it("swaps from the child to the parent", () => {
      // TODO: implement
      expect(false).to.eq(true);
    });
  });

  describe("top off", () => {
    it("allows topping off of parent", () => {
      // TODO: implement
      expect(false).to.eq(true);
    });
  });
});
