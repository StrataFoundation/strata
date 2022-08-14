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
    wrappedSolMint,
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

  lowestOrUndefined(one: PublicKey, two: PublicKey): PublicKey | undefined {
    return this.toArray().find(
      (hierarchy) =>
        hierarchy.tokenBonding.targetMint.equals(
          sanitizeSolMint(one, this.wrappedSolMint)
        ) ||
        hierarchy.tokenBonding.targetMint.equals(
          sanitizeSolMint(two, this.wrappedSolMint)
        )
    )?.tokenBonding?.targetMint;
  }

  lowest(one: PublicKey, two: PublicKey): PublicKey {
    const found = this.lowestOrUndefined(one, two);

    if (!found) {
      throw new Error(
        `No bonding found with target mint ${one.toBase58()} or ${two.toBase58()}`
      );
    }

    return found;
  }

  highestOrUndefined(one: PublicKey, two: PublicKey): PublicKey | undefined {
    return this.toArray().find(
      (hierarchy) =>
        hierarchy.tokenBonding.baseMint.equals(
          sanitizeSolMint(one, this.wrappedSolMint)
        ) ||
        hierarchy.tokenBonding.baseMint.equals(
          sanitizeSolMint(two, this.wrappedSolMint)
        )
    )?.tokenBonding?.baseMint;
  }

  highest(one: PublicKey, two: PublicKey): PublicKey {
    const found = this.highestOrUndefined(one, two);

    if (!found) {
      throw new Error(
        `No bonding found with target mint ${one.toBase58()} or ${two.toBase58()}`
      );
    }

    return found;
  }

  /**
   * Get the path from one token to another.
   *
   * @param one
   * @param two
   * @param ignoreFrozen - Ignore frozen curves, just compute the value
   */
  path(
    one: PublicKey,
    two: PublicKey,
    ignoreFrozen: boolean = false
  ): BondingHierarchy[] {
    const lowest = this.lowestOrUndefined(one, two);
    if (!lowest) {
      return [];
    }

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

    const buying = lowest.equals(two);
    const result = arr.slice(lowIdx, highIdx + 1);

    if (
      ignoreFrozen ||
      result.every((r) =>
        buying ? !r.tokenBonding.buyFrozen : !r.tokenBonding.sellFrozen
      )
    ) {
      return result;
    } else {
      return [];
    }
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
