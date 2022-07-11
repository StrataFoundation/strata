import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { PricingState, useBondingPricing } from "./bondingPricing";
import { ITokenSwap } from "./useTokenSwapFromFungibleEntangler";
import { useTokenSwapFromId } from "./useTokenSwapFromId";
import { BondingHierarchy, IBondingPricing } from "@strata-foundation/spl-token-bonding";

class WrappedPricing implements IBondingPricing {
  pricing: IBondingPricing;
  childEntanglerMint: PublicKey;
  parentEntanglerMint: PublicKey;

  get hierarchy(): BondingHierarchy {
    return this.pricing.hierarchy;
  }

  constructor({
    pricing,
    childEntanglerMint,
    parentEntanglerMint,
  }: {
    pricing: IBondingPricing;
    childEntanglerMint: PublicKey;
    parentEntanglerMint: PublicKey;
  }) {
    this.pricing = pricing;
    this.childEntanglerMint = childEntanglerMint;
    this.parentEntanglerMint = parentEntanglerMint;
  }

  subEntangledMint(mint: PublicKey) {
    if (mint && mint.equals(this.parentEntanglerMint)) {
      return this.childEntanglerMint
    }

    return mint;
  }

  current(baseMint: PublicKey, unixTime?: number): number {
    return this.pricing.current(this.subEntangledMint(baseMint), unixTime)
  }

  locked(baseMint?: PublicKey): number {
    return this.pricing.locked(
      this.subEntangledMint(baseMint || this.hierarchy.tokenBonding.baseMint)
    );
  }
  swap(
    baseAmount: number,
    baseMint: PublicKey,
    targetMint: PublicKey,
    ignoreFrozen: boolean,
    unixTime?: number
  ): number {
    return this.pricing.swap(
      baseAmount,
      this.subEntangledMint(baseMint),
      this.subEntangledMint(targetMint),
      ignoreFrozen,
      unixTime
    );
  }
  isBuying(lowMint: PublicKey, targetMint: PublicKey): boolean {
    return this.pricing.isBuying(this.subEntangledMint(lowMint), this.subEntangledMint(targetMint));
  }
  swapTargetAmount(
    targetAmount: number,
    baseMint: PublicKey,
    targetMint: PublicKey,
    ignoreFreeze: boolean,
    unixTime?: number
  ): number {
    return this.pricing.swapTargetAmount(
      targetAmount,
      this.subEntangledMint(baseMint),
      this.subEntangledMint(targetMint),
      ignoreFreeze,
      unixTime
    );
  }
  sellTargetAmount(
    targetAmountNum: number,
    baseMint?: PublicKey,
    unixTime?: number
  ): number {
    return this.pricing.sellTargetAmount(
      targetAmountNum,
      this.subEntangledMint(baseMint || this.hierarchy.tokenBonding.baseMint),
      unixTime
    );
  }
  buyTargetAmount(
    targetAmountNum: number,
    baseMint?: PublicKey,
    unixTime?: number
  ): number {
    return this.pricing.buyTargetAmount(
      targetAmountNum,
      this.subEntangledMint(baseMint || this.hierarchy.tokenBonding.baseMint),
      unixTime
    );
  }
  buyWithBaseAmount(
    baseAmountNum: number,
    baseMint?: PublicKey,
    unixTime?: number
  ): number {
    return this.pricing.buyWithBaseAmount(
      baseAmountNum,
      this.subEntangledMint(baseMint || this.hierarchy.tokenBonding.baseMint),
      unixTime
    );
  }
}

export function useSwapPricing(id: PublicKey | undefined): PricingState & ITokenSwap & { pricingLoading: boolean } {
  const {
    tokenBonding,
    childEntangler,
    parentEntangler,
    ...rest1
  } = useTokenSwapFromId(id);

  const { pricing, ...rest } = useBondingPricing(tokenBonding?.publicKey);

  const newPricing = useMemo(() => {
    if (pricing && childEntangler && parentEntangler) {
      return new WrappedPricing({
        pricing,
        childEntanglerMint: childEntangler?.childMint,
        parentEntanglerMint: parentEntangler?.parentMint,
      });
    }
    return pricing;
  }, [pricing, childEntangler, parentEntangler]);

  return {
    tokenBonding,
    childEntangler,
    parentEntangler,
    pricing: newPricing,
    ...rest1,
    ...rest,
    loading: rest1.loading,
    pricingLoading: rest.loading,
  };
}
