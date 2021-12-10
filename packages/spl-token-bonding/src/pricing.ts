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
}: {
  hierarchy?: BondingHierarchy;
  func: (acc: A, current: BondingHierarchy) => A;
  initial: A;
  destination: PublicKey;
}): A {
  if (!hierarchy) {
    return initial;
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
}: {
  hierarchy?: BondingHierarchy;
  func: (acc: A, current: BondingHierarchy) => A;
  initial: A;
  destination: PublicKey;
}): A {
  if (!hierarchy) {
    return initial;
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

export class BondingPricing {
  hierarchy: BondingHierarchy;

  constructor(args: { hierarchy: BondingHierarchy }) {
    this.hierarchy = args.hierarchy;
  }

  current(baseMint: PublicKey = this.hierarchy.tokenBonding.baseMint): number {
    return reduce({
      hierarchy: this.hierarchy,
      func: (acc: number, current: BondingHierarchy) => {
        return acc * current.pricingCurve.current();
      },
      initial: 1,
      destination: baseMint,
    });
  }

  locked(baseMint: PublicKey = this.hierarchy.tokenBonding.baseMint): number {
    return reduce({
      hierarchy: this.hierarchy.parent,
      func: (acc: number, current: BondingHierarchy) => {
        return acc * current.pricingCurve.current();
      },
      initial: this.hierarchy.pricingCurve.locked(),
      destination: baseMint,
    });
  }

  swap(baseAmount: number, baseMint: PublicKey, targetMint: PublicKey): number {
    const lowMint = this.hierarchy.lowest(baseMint, targetMint);
    const highMint = lowMint.equals(baseMint) ? targetMint : baseMint;
    const isBuying = lowMint.equals(targetMint);

    const path = this.hierarchy.path(lowMint, highMint);
    if (isBuying) {
      return path.reverse().reduce((amount, { pricingCurve, tokenBonding }) => {
        return pricingCurve.buyWithBaseAmount(
          amount,
          tokenBonding.buyBaseRoyaltyPercentage,
          tokenBonding.buyTargetRoyaltyPercentage
        )
      }, baseAmount)
    } else {
    console.log(path)
      return path.reduce((amount, { pricingCurve, tokenBonding }) => {
        return pricingCurve.sellTargetAmount(
          amount,
          tokenBonding.sellBaseRoyaltyPercentage,
          tokenBonding.sellTargetRoyaltyPercentage
        )
      }, baseAmount)
    }
  }

  sellTargetAmount(
    targetAmountNum: number,
    baseMint: PublicKey = this.hierarchy.tokenBonding.baseMint
  ): number {
    return reduce({
      hierarchy: this.hierarchy,
      func: (acc: number, current: BondingHierarchy) => {
        return current.pricingCurve.sellTargetAmount(
          acc,
          current.tokenBonding.sellBaseRoyaltyPercentage,
          current.tokenBonding.sellTargetRoyaltyPercentage
        );
      },
      initial: targetAmountNum,
      destination: baseMint,
    });
  }

  buyTargetAmount(
    targetAmountNum: number,
    baseMint: PublicKey = this.hierarchy.tokenBonding.baseMint
  ): number {
    return reduce({
      hierarchy: this.hierarchy,
      func: (acc: number, current: BondingHierarchy) => {
        return current.pricingCurve.buyTargetAmount(
          acc,
          current.tokenBonding.buyBaseRoyaltyPercentage,
          current.tokenBonding.buyTargetRoyaltyPercentage
        );
      },
      initial: targetAmountNum,
      destination: baseMint,
    });
  }

  buyWithBaseAmount(
    baseAmountNum: number,
    baseMint: PublicKey = this.hierarchy.tokenBonding.baseMint
  ): number {
    return reduceFromParent({
      hierarchy: this.hierarchy,
      func: (acc: number, current: BondingHierarchy) => {
        return current.pricingCurve.buyWithBaseAmount(
          acc,
          current.tokenBonding.buyBaseRoyaltyPercentage,
          current.tokenBonding.buyTargetRoyaltyPercentage
        );
      },
      initial: baseAmountNum,
      destination: baseMint,
    });
  }
}
