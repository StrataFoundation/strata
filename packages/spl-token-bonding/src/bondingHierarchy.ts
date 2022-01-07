import { NATIVE_MINT } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { ITokenBonding, IPricingCurve, SplTokenBonding } from ".";

function sanitizeSolMint(mint: PublicKey, wrappedSolMint: PublicKey): PublicKey {
  if (mint.equals(NATIVE_MINT)) {
    return wrappedSolMint;
  }

  return mint;
}

export class BondingHierarchy {
  parent?: BondingHierarchy;
  child?: BondingHierarchy;
  tokenBonding: ITokenBonding;
  pricingCurve: IPricingCurve;
  wrappedSolMint: PublicKey;

  constructor({
    parent,
    child,
    tokenBonding,
    pricingCurve,
    wrappedSolMint
  }: {
    parent?: BondingHierarchy;
    child?: BondingHierarchy;
    tokenBonding: ITokenBonding;
    pricingCurve: IPricingCurve;
    wrappedSolMint: PublicKey;
  }) {
    this.parent = parent;
    this.child = child;
    this.tokenBonding = tokenBonding;
    this.pricingCurve = pricingCurve;
    this.wrappedSolMint = wrappedSolMint;
  }

  toArray(): BondingHierarchy[] {
    let arr: BondingHierarchy[] = [];
    let current: BondingHierarchy | undefined = this;
    do {
      arr.push(current);
      current = current?.parent;
    } while (current);

    return arr;
  }

  lowest(one: PublicKey, two: PublicKey): PublicKey {
    console.log(one.toBase58(), two.toBase58())
    return this.toArray().find(
      (hierarchy) =>
        hierarchy.tokenBonding.targetMint.equals(sanitizeSolMint(one, this.wrappedSolMint)) ||
        hierarchy.tokenBonding.targetMint.equals(sanitizeSolMint(two, this.wrappedSolMint))
    )!.tokenBonding.targetMint;
  }

  /**
   * Get the path from one token to another.
   *
   * @param one
   * @param two
   */
  path(one: PublicKey, two: PublicKey): BondingHierarchy[] {
    const lowest = this.lowest(one, two);
    const highest = lowest.equals(one)
      ? sanitizeSolMint(two, this.wrappedSolMint)
      : sanitizeSolMint(one, this.wrappedSolMint);
    const arr = this.toArray();
    const lowIdx = arr.findIndex((h) =>
      h.tokenBonding.targetMint.equals(lowest)
    );
    const highIdx = arr.findIndex((h) =>
      h.tokenBonding.baseMint.equals(highest)
    );
    return arr.slice(lowIdx, highIdx + 1);
  }

  /**
   * Find the bonding curve whose target is this mint
   *
   * @param mint
   */
  findTarget(mint: PublicKey): ITokenBonding {
    return this.toArray().find((h) => h.tokenBonding.targetMint.equals(mint))!
      .tokenBonding;
  }

  /**
   * Does this hierarchy contain all of these mints?
   *
   * @param mints
   */
  contains(...mints: PublicKey[]): boolean {
    const availableMints = new Set(
      this.toArray().flatMap((h) => [
        h.tokenBonding.baseMint.toBase58(),
        h.tokenBonding.targetMint.toBase58(),
      ])
    );
    return mints.every((mint) =>
      availableMints.has(sanitizeSolMint(mint, this.wrappedSolMint).toBase58())
    );
  }
}
