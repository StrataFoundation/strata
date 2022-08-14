import * as anchor from "@project-serum/anchor";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { expect, use } from "chai";
import ChaiAsPromised from "chai-as-promised";
import { createMint, createAtaAndMint } from "@strata-foundation/spl-utils";
import {
  FungibleEntangler,
  IFungibleParentEntangler,
  IFungibleChildEntangler,
} from "../packages/fungible-entangler/src";
import { TokenUtils } from "./utils/token";
import { waitForUnixTime } from "./utils/clock";
import { AnchorProvider } from "@project-serum/anchor";
use(ChaiAsPromised);
const tB58 = (p: PublicKey | null) => p?.toBase58();

describe("fungible-entangler", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.local("http://127.0.0.1:8899"));
  const provider = anchor.getProvider() as AnchorProvider;

  const program = anchor.workspace.FungibleEntangler;
  const tokenUtils = new TokenUtils(provider);
  const fungibleEntanglerProgram = new FungibleEntangler(provider, program);
  const me = fungibleEntanglerProgram.wallet.publicKey;

  it("allows creation of a parent entangler", async () => {
    const dynamicSeed = Keypair.generate().publicKey;
    const parentMint = await createMint(provider, me, 0);
    await createAtaAndMint(provider, parentMint, 100);

    const { entangler: parentEntanglerOut } =
      await fungibleEntanglerProgram.createFungibleParentEntangler({
        authority: me,
        mint: parentMint,
        amount: 100,
        dynamicSeed: dynamicSeed.toBuffer(),
      });

    const parentEntanglerAcct =
      (await fungibleEntanglerProgram.getParentEntangler(parentEntanglerOut))!;

    expect(tB58(parentEntanglerAcct.parentMint)).to.eq(tB58(parentMint));
    expect(tB58(parentEntanglerAcct.authority)).to.eq(tB58(me));

    await tokenUtils.expectAtaBalance(me, parentEntanglerAcct.parentMint, 0);
    await tokenUtils.expectBalance(parentEntanglerAcct.parentStorage, 100);
  });

  it("allows creation of a child entangler", async () => {
    const dynamicSeed = Keypair.generate().publicKey;
    const parentMint = await createMint(provider, me, 0);
    const childMint = await createMint(provider, me);
    await createAtaAndMint(provider, parentMint, 100);

    const { entangler: parentEntanglerOut } =
      await fungibleEntanglerProgram.createFungibleParentEntangler({
        authority: me,
        mint: parentMint,
        amount: 100,
        dynamicSeed: dynamicSeed.toBuffer(),
      });

    const { entangler: childEntanglerOut } =
      await fungibleEntanglerProgram.createFungibleChildEntangler({
        authority: me,
        mint: childMint,
        parentEntangler: parentEntanglerOut,
      });

    const childEntanglerAcct =
      (await fungibleEntanglerProgram.getChildEntangler(childEntanglerOut))!;

    expect(tB58(childEntanglerAcct.childMint)).to.eq(tB58(childMint));

    await tokenUtils.expectBalance(childEntanglerAcct.childStorage, 0);
  });

  it("creates both parentEntangler and childEntangler with a singleMethod", async () => {
    const dynamicSeed = Keypair.generate().publicKey;
    const parentMint = await createMint(provider, me, 0);
    const childMint = await createMint(provider, me, 0);
    await createAtaAndMint(provider, parentMint, 100);

    const {
      parentEntangler: parentEntanglerOut,
      childEntangler: childEntanglerOut,
    } = await fungibleEntanglerProgram.createFungibleEntangler({
      authority: me,
      parentMint,
      childMint,
      amount: 100,
      dynamicSeed: dynamicSeed.toBuffer(),
    });

    const parentEntanglerAcct =
      (await fungibleEntanglerProgram.getParentEntangler(parentEntanglerOut))!;

    const childEntanglerAcct =
      (await fungibleEntanglerProgram.getChildEntangler(childEntanglerOut))!;

    expect(tB58(parentEntanglerAcct.parentMint)).to.eq(tB58(parentMint));
    expect(tB58(parentEntanglerAcct.authority)).to.eq(tB58(me));
    await tokenUtils.expectAtaBalance(me, parentEntanglerAcct.parentMint, 0);
    await tokenUtils.expectBalance(parentEntanglerAcct.parentStorage, 100);
    expect(tB58(childEntanglerAcct.childMint)).to.eq(tB58(childMint));
    await tokenUtils.expectBalance(childEntanglerAcct.childStorage, 0);
  });

  describe("swapParentForChild", () => {
    let parentMint,
      childMint,
      parentEntangler: PublicKey,
      childEntangler: PublicKey,
      parentEntanglerAcct: IFungibleParentEntangler | null,
      childEntanglerAcct: IFungibleChildEntangler | null;

    beforeEach(async () => {
      const dynamicSeed = Keypair.generate().publicKey;
      parentMint = await createMint(provider, me, 0);
      childMint = await createMint(provider, me, 0);
      await createAtaAndMint(provider, parentMint, 100);
      await createAtaAndMint(provider, childMint, 50);

      const {
        parentEntangler: parentEntanglerOut,
        childEntangler: childEntanglerOut,
        childStorage: childStorageOut,
      } = await fungibleEntanglerProgram.createFungibleEntangler({
        authority: me,
        parentMint,
        childMint,
        amount: 50,
        dynamicSeed: dynamicSeed.toBuffer(),
      });

      parentEntangler = parentEntanglerOut;
      childEntangler = childEntanglerOut;
      await tokenUtils.mintTo(childMint, 50, childStorageOut);

      parentEntanglerAcct = (await fungibleEntanglerProgram.getParentEntangler(
        parentEntanglerOut
      ))!;

      childEntanglerAcct = (await fungibleEntanglerProgram.getChildEntangler(
        childEntanglerOut
      ))!;
    });


    it("swaps amount from the parent to a child", async () => {
      await waitForUnixTime(
        provider.connection,
        BigInt(childEntanglerAcct!.goLiveUnixTime.toNumber() + 1)
      );

      await fungibleEntanglerProgram.swapParentForChild({
        parentEntangler,
        childEntangler,
        amount: 30,
      });

      await tokenUtils.expectBalance(parentEntanglerAcct!.parentStorage, 80);
      await tokenUtils.expectBalance(childEntanglerAcct!.childStorage, 20);
      await tokenUtils.expectAtaBalance(
        me,
        parentEntanglerAcct!.parentMint,
        20
      );
      await tokenUtils.expectAtaBalance(me, childEntanglerAcct!.childMint, 80);
    });

    it("swaps all from parent to a child", async () => {
      await waitForUnixTime(
        provider.connection,
        BigInt(childEntanglerAcct!.goLiveUnixTime.toNumber() + 1)
      );

      await fungibleEntanglerProgram.swapParentForChild({
        parentEntangler,
        childEntangler,
        all: true,
      });

      await tokenUtils.expectBalance(parentEntanglerAcct!.parentStorage, 100);
      await tokenUtils.expectBalance(childEntanglerAcct!.childStorage, 0);
      await tokenUtils.expectAtaBalance(me, parentEntanglerAcct!.parentMint, 0);
      await tokenUtils.expectAtaBalance(me, childEntanglerAcct!.childMint, 100);
    });
  });

  describe("swapChildForParent", () => {
    let parentMint,
      childMint,
      parentEntangler: PublicKey,
      childEntangler: PublicKey,
      parentEntanglerAcct: IFungibleParentEntangler | null,
      childEntanglerAcct: IFungibleChildEntangler | null;

    beforeEach(async () => {
      const dynamicSeed = Keypair.generate().publicKey;
      parentMint = await createMint(provider, me, 0);
      childMint = await createMint(provider, me, 0);
      await createAtaAndMint(provider, parentMint, 100);
      await createAtaAndMint(provider, childMint, 50);

      const {
        parentEntangler: parentEntanglerOut,
        childEntangler: childEntanglerOut,
        childStorage: childStorageOut,
      } = await fungibleEntanglerProgram.createFungibleEntangler({
        authority: me,
        parentMint,
        childMint,
        amount: 50,
        dynamicSeed: dynamicSeed.toBuffer(),
      });

      parentEntangler = parentEntanglerOut;
      childEntangler = childEntanglerOut;

      parentEntanglerAcct = (await fungibleEntanglerProgram.getParentEntangler(
        parentEntanglerOut
      ))!;

      childEntanglerAcct = (await fungibleEntanglerProgram.getChildEntangler(
        childEntanglerOut
      ))!;
    });

    it("swaps amount from the child to the parent", async () => {
      await waitForUnixTime(
        provider.connection,
        BigInt(parentEntanglerAcct!.goLiveUnixTime.toNumber() + 1)
      );

      await fungibleEntanglerProgram.swapChildForParent({
        parentEntangler,
        childEntangler,
        amount: 30,
      });

      await tokenUtils.expectBalance(parentEntanglerAcct!.parentStorage, 20);
      await tokenUtils.expectBalance(childEntanglerAcct!.childStorage, 30);
      await tokenUtils.expectAtaBalance(
        me,
        parentEntanglerAcct!.parentMint,
        80
      );
      await tokenUtils.expectAtaBalance(me, childEntanglerAcct!.childMint, 20);
    });

    it("swaps all from child to a parent", async () => {
      await waitForUnixTime(
        provider.connection,
        BigInt(parentEntanglerAcct!.goLiveUnixTime.toNumber() + 1)
      );

      await fungibleEntanglerProgram.swapChildForParent({
        parentEntangler,
        childEntangler,
        all: true,
      });

      await tokenUtils.expectBalance(parentEntanglerAcct!.parentStorage, 0);
      await tokenUtils.expectBalance(childEntanglerAcct!.childStorage, 50);
      await tokenUtils.expectAtaBalance(
        me,
        parentEntanglerAcct!.parentMint,
        100
      );
      await tokenUtils.expectAtaBalance(me, childEntanglerAcct!.childMint, 0);
    });
  });

  describe("transfer and close", () => {
    let parentMint,
      childMint,
      parentEntangler: PublicKey,
      childEntangler: PublicKey,
      parentEntanglerAcct: IFungibleParentEntangler | null,
      childEntanglerAcct: IFungibleChildEntangler | null;

    beforeEach(async () => {
      const dynamicSeed = Keypair.generate().publicKey;
      parentMint = await createMint(provider, me, 0);
      childMint = await createMint(provider, me, 0);
      await createAtaAndMint(provider, parentMint, 100);
      await createAtaAndMint(provider, childMint, 50);

      const {
        parentEntangler: parentEntanglerOut,
        childEntangler: childEntanglerOut,
        childStorage: childStorageOut,
      } = await fungibleEntanglerProgram.createFungibleEntangler({
        authority: me,
        parentMint,
        childMint,
        amount: 50,
        dynamicSeed: dynamicSeed.toBuffer(),
      });

      parentEntangler = parentEntanglerOut;
      childEntangler = childEntanglerOut;

      parentEntanglerAcct =
        (await fungibleEntanglerProgram.getParentEntangler(
          parentEntanglerOut
        ))!;

      childEntanglerAcct =
        (await fungibleEntanglerProgram.getChildEntangler(
          childEntanglerOut
        ))!;
    });

    it("transfers from the child back to the admin", async () => {
      await waitForUnixTime(
        provider.connection,
        BigInt(parentEntanglerAcct!.goLiveUnixTime.toNumber() + 1)
      );

      await fungibleEntanglerProgram.swapChildForParent({
        parentEntangler,
        childEntangler,
        amount: 30,
      });

      await fungibleEntanglerProgram.transfer({
        childEntangler,
        amount: 15
      })

      await tokenUtils.expectBalance(parentEntanglerAcct!.parentStorage, 20);
      await tokenUtils.expectBalance(childEntanglerAcct!.childStorage, 15);
      await tokenUtils.expectAtaBalance(
        me,
        parentEntanglerAcct!.parentMint,
        80
      );
      await tokenUtils.expectAtaBalance(me, childEntanglerAcct!.childMint, 35);
    });

    it("closes the child entangler", async () => {
      await waitForUnixTime(
        provider.connection,
        BigInt(parentEntanglerAcct!.goLiveUnixTime.toNumber() + 1)
      );

      await fungibleEntanglerProgram.close({
        childEntangler,
      });
      const childEntanglerAcct =
        (await fungibleEntanglerProgram.getChildEntangler(
          childEntangler
        ));
      expect(childEntanglerAcct).to.be.null;
    });

    it("transfers from the parent back to the admin", async () => {
      await waitForUnixTime(
        provider.connection,
        BigInt(parentEntanglerAcct!.goLiveUnixTime.toNumber() + 1)
      );

      await fungibleEntanglerProgram.swapChildForParent({
        parentEntangler,
        childEntangler,
        amount: 30,
      });

      await fungibleEntanglerProgram.transfer({
        parentEntangler,
        amount: 15,
      });

      await tokenUtils.expectBalance(
        parentEntanglerAcct!.parentStorage,
        5
      );
      await tokenUtils.expectBalance(childEntanglerAcct!.childStorage, 30);
      await tokenUtils.expectAtaBalance(
        me,
        parentEntanglerAcct!.parentMint,
        95
      );
      await tokenUtils.expectAtaBalance(
        me,
        childEntanglerAcct!.childMint,
        20
      );
    });

    it("closes the parent entangler", async () => {
      await waitForUnixTime(
        provider.connection,
        BigInt(parentEntanglerAcct!.goLiveUnixTime.toNumber() + 1)
      );

      await fungibleEntanglerProgram.transfer({
        parentEntangler,
        amount: 50
      });
      await fungibleEntanglerProgram.close({
        childEntangler,
      });
      await fungibleEntanglerProgram.close({
        parentEntangler,
      });
      const parentEntanglerAcct2 =
        await fungibleEntanglerProgram.getParentEntangler(parentEntangler);
      expect(parentEntanglerAcct2).to.be.null;
    });
  });

  describe("top off", () => {
    let parentMint,
      childMint,
      parentEntangler: PublicKey,
      childEntangler: PublicKey,
      parentEntanglerAcct: IFungibleParentEntangler | null,
      childEntanglerAcct: IFungibleChildEntangler | null;

    beforeEach(async () => {
      const dynamicSeed = Keypair.generate().publicKey;
      parentMint = await createMint(provider, me, 0);
      childMint = await createMint(provider, me, 0);
      await createAtaAndMint(provider, parentMint, 100);
      await createAtaAndMint(provider, childMint, 100);

      const {
        parentEntangler: parentEntanglerOut,
        childEntangler: childEntanglerOut,
        childStorage: childStorageOut,
      } = await fungibleEntanglerProgram.createFungibleEntangler({
        authority: me,
        parentMint,
        childMint,
        amount: 0,
        dynamicSeed: dynamicSeed.toBuffer(),
      });

      parentEntangler = parentEntanglerOut;
      childEntangler = childEntanglerOut;

      parentEntanglerAcct = (await fungibleEntanglerProgram.getParentEntangler(
        parentEntanglerOut
      ))!;

      childEntanglerAcct = (await fungibleEntanglerProgram.getChildEntangler(
        childEntanglerOut
      ))!;
    });
    it("allows topping off of parent", async () => {
      // TODO: implement
      await fungibleEntanglerProgram.topOff({
        parentEntangler,
        amount: 100,
      });

      await tokenUtils.expectBalance(parentEntanglerAcct!.parentStorage, 100);
      await tokenUtils.expectAtaBalance(me, parentEntanglerAcct!.parentMint, 0);
    });

    it("allows topping off of child", async () => {
      await fungibleEntanglerProgram.topOff({
        childEntangler,
        amount: 100,
      });

      await tokenUtils.expectBalance(childEntanglerAcct!.childStorage, 100);
      await tokenUtils.expectAtaBalance(me, childEntanglerAcct!.childMint, 0);
    });
  });
});
