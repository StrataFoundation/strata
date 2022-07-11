import { NATIVE_MINT } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { BondingHierarchy } from ".";

/**
 * Traverse a bonding hierarchy, executing func and accumulating
 * the results until destination token
 *
 * @param param0
 * @returns
 */
function reduce<A>({
  hierarchy,
  func,
  initial,
  destination,
  wrappedSolMint,
}: {
  hierarchy?: BondingHierarchy;
  func: (acc: A, current: BondingHierarchy) => A;
  initial: A;
  destination: PublicKey;
  wrappedSolMint: PublicKey;
}): A {
  if (
    !hierarchy ||
    hierarchy.child?.tokenBonding.baseMint.equals(destination)
  ) {
    return initial;
  }

  if (destination?.equals(NATIVE_MINT)) {
    destination = wrappedSolMint;
  }

  let current: BondingHierarchy | undefined = hierarchy;
  let value = func(initial, current!);
  while (!current!.tokenBonding.baseMint.equals(destination)) {
    current = current!.parent;
    if (!current) {
      throw new Error(
        `Base mint ${destination.toBase58()} is not in the hierarchy for ${hierarchy.tokenBonding.publicKey.toBase58()}`
      );
    }
    value = func(value, current);
  }

  return value;
}

/**
 * Traverse a bonding hierarchy, executing func and accumulating
 * the results until destination token starting from parent going to children
 *
 * @param param0
 * @returns
 */
function reduceFromParent<A>({
  hierarchy,
  func,
  initial,
  destination,
  wrappedSolMint,
}: {
  hierarchy?: BondingHierarchy;
  func: (acc: A, current: BondingHierarchy) => A;
  initial: A;
  destination: PublicKey;
  wrappedSolMint: PublicKey;
}): A {
  if (!hierarchy) {
    return initial;
  }

  if (destination?.equals(NATIVE_MINT)) {
    destination = wrappedSolMint;
  }

  let current: BondingHierarchy | undefined = hierarchy;
  while (!current!.tokenBonding.baseMint.equals(destination)) {
    current = current!.parent;
    if (!current) {
      throw new Error(
        `Base mint ${destination.toBase58()} is not in the hierarchy for ${hierarchy.tokenBonding.publicKey.toBase58()}`
      );
    }
  }
  destination = hierarchy.tokenBonding.targetMint;

  let value = func(initial, current!);
  while (!current!.tokenBonding.targetMint.equals(destination)) {
    current = current!.child;
    value = func(value, current!);
  }

  return value;
}

function now(): number {
  return new Date().valueOf() / 1000;
}

export interface IBondingPricing {

  get hierarchy(): BondingHierarchy;

  current(baseMint: PublicKey, unixTime?: number): number;

  locked(baseMint?: PublicKey): number;

  swap(
    baseAmount: number,
    baseMint: PublicKey,
    targetMint: PublicKey,
    ignoreFrozen: boolean,
    unixTime?: number,
  ): number;

  isBuying(
    lowMint: PublicKey,
    targetMint: PublicKey,
  ): boolean;

  swapTargetAmount(
    targetAmount: number,
    baseMint: PublicKey,
    targetMint: PublicKey,
    /** Ignore frozen curves, just compute the value. */
    ignoreFreeze: boolean,
    unixTime?: number,
  ): number;

  sellTargetAmount(
    targetAmountNum: number,
    baseMint?: PublicKey,
    unixTime?: number
  ): number;

  buyTargetAmount(
    targetAmountNum: number,
    baseMint?: PublicKey,
    unixTime?: number
  ): number;

  buyWithBaseAmount(
    baseAmountNum: number,
    baseMint?: PublicKey,
    unixTime?: number
  ): number ;
}

export class BondingPricing implements IBondingPricing {
  hierarchy: BondingHierarchy;

  constructor(args: { hierarchy: BondingHierarchy }) {
    this.hierarchy = args.hierarchy;
  }

  current(
    baseMint?: PublicKey,
    unixTime?: number
  ): number {
    return reduce({
      hierarchy: this.hierarchy,
      func: (acc: number, current: BondingHierarchy) => {
        return (
          acc *
          current.pricingCurve.current(
            unixTime || now(),
            current.tokenBonding.buyBaseRoyaltyPercentage,
            current.tokenBonding.buyTargetRoyaltyPercentage
          )
        );
      },
      initial: 1,
      destination: baseMint || this.hierarchy.tokenBonding.baseMint,
      wrappedSolMint: this.hierarchy.wrappedSolMint,
    });
  }

  locked(baseMint?: PublicKey): number {
    return reduce({
      hierarchy: this.hierarchy.parent,
      func: (acc: number, current: BondingHierarchy) => {
        return (
          acc *
          current.pricingCurve.current(
            now(),
            current.tokenBonding.buyBaseRoyaltyPercentage,
            current.tokenBonding.buyTargetRoyaltyPercentage
          )
        );
      },
      initial: this.hierarchy.pricingCurve.locked(),
      destination: baseMint || this.hierarchy.tokenBonding.baseMint,
      wrappedSolMint: this.hierarchy.wrappedSolMint,
    });
  }

  swap(
    baseAmount: number,
    baseMint: PublicKey,
    targetMint: PublicKey,
    ignoreFrozen: boolean = false,
    unixTime?: number,
  ): number {
    const lowMint = this.hierarchy.lowest(baseMint, targetMint);
    const highMint = this.hierarchy.highest(baseMint, targetMint);
    const isBuying = this.isBuying(
      lowMint,
      targetMint,
    );

    const path = this.hierarchy.path(lowMint, highMint, ignoreFrozen);

    if (path.length == 0) {
      throw new Error(`No path from ${baseMint} to ${targetMint}`);
    }

    if (isBuying) {
      return path.reverse().reduce((amount, { pricingCurve, tokenBonding }) => {
        return pricingCurve.buyWithBaseAmount(
          amount,
          tokenBonding.buyBaseRoyaltyPercentage,
          tokenBonding.buyTargetRoyaltyPercentage,
          unixTime
        );
      }, baseAmount);
    } else {
      return path.reduce((amount, { pricingCurve, tokenBonding }) => {
        return pricingCurve.sellTargetAmount(
          amount,
          tokenBonding.sellBaseRoyaltyPercentage,
          tokenBonding.sellTargetRoyaltyPercentage,
          unixTime
        );
      }, baseAmount);
    }
  }

  isBuying(
    lowMint: PublicKey,
    targetMint: PublicKey,
  ) {
    return lowMint.equals(targetMint);
  }

  swapTargetAmount(
    targetAmount: number,
    baseMint: PublicKey,
    targetMint: PublicKey,
    /** Ignore frozen curves, just compute the value. */
    ignoreFreeze: boolean = false,
    unixTime?: number,
  ): number {
    const lowMint = this.hierarchy.lowest(baseMint, targetMint);
    const highMint = this.hierarchy.highest(baseMint, targetMint);
    const isBuying = this.isBuying(
      lowMint,
      targetMint,
    );

    const path = this.hierarchy.path(lowMint, highMint, ignoreFreeze);

    if (path.length == 0) {
      throw new Error(`No path from ${baseMint} to ${targetMint}`);
    }

    return isBuying
      ? path.reverse().reduce((amount, { pricingCurve, tokenBonding }) => {
          return pricingCurve.buyWithBaseAmount(
            -amount,
            tokenBonding.sellBaseRoyaltyPercentage,
            tokenBonding.sellTargetRoyaltyPercentage,
            unixTime
          );
        }, targetAmount)
      : path.reverse().reduce((amount, { pricingCurve, tokenBonding }) => {
          return pricingCurve.buyTargetAmount(
            amount,
            tokenBonding.buyBaseRoyaltyPercentage,
            tokenBonding.buyTargetRoyaltyPercentage,
            unixTime
          );
        }, targetAmount);
  }

  sellTargetAmount(
    targetAmountNum: number,
    baseMint?: PublicKey,
    unixTime?: number
  ): number {
    return reduce({
      hierarchy: this.hierarchy,
      func: (acc: number, current: BondingHierarchy) => {
        return current.pricingCurve.sellTargetAmount(
          acc,
          current.tokenBonding.sellBaseRoyaltyPercentage,
          current.tokenBonding.sellTargetRoyaltyPercentage,
          unixTime
        );
      },
      initial: targetAmountNum,
      destination: baseMint || this.hierarchy.tokenBonding.baseMint,
      wrappedSolMint: this.hierarchy.wrappedSolMint,
    });
  }

  buyTargetAmount(
    targetAmountNum: number,
    baseMint?: PublicKey,
    unixTime?: number
  ): number {
    return reduce({
      hierarchy: this.hierarchy,
      func: (acc: number, current: BondingHierarchy) => {
        return current.pricingCurve.buyTargetAmount(
          acc,
          current.tokenBonding.buyBaseRoyaltyPercentage,
          current.tokenBonding.buyTargetRoyaltyPercentage,
          unixTime
        );
      },
      initial: targetAmountNum,
      destination: baseMint || this.hierarchy.tokenBonding.baseMint,
      wrappedSolMint: this.hierarchy.wrappedSolMint,
    });
  }

  buyWithBaseAmount(
    baseAmountNum: number,
    baseMint?: PublicKey,
    unixTime?: number
  ): number {
    return reduceFromParent({
      hierarchy: this.hierarchy,
      func: (acc: number, current: BondingHierarchy) => {
        return current.pricingCurve.buyWithBaseAmount(
          acc,
          current.tokenBonding.buyBaseRoyaltyPercentage,
          current.tokenBonding.buyTargetRoyaltyPercentage,
          unixTime
        );
      },
      initial: baseAmountNum,
      destination: baseMint || this.hierarchy.tokenBonding.baseMint,
      wrappedSolMint: this.hierarchy.wrappedSolMint,
    });
  }
}
