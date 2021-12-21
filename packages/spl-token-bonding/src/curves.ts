import { AccountInfo, MintInfo } from "@solana/spl-token";
// @ts-ignore
import BN from "bn.js";
import { amountAsNum, asDecimal, supplyAsNum } from "./utils";

export type ExponentialCurveV0 = {
  c: BN;
  b: BN;
  pow: number;
  frac: number;
};

export function fromCurve(
  curve: any,
  baseStorage: AccountInfo,
  baseMint: MintInfo,
  targetMint: MintInfo,
  goLiveUnixTime: number
): IPricingCurve {
  switch (Object.keys(curve.definition)[0]) {
    case "timeV0":
      return new TimeCurve({
        curve,
        baseStorage,
        baseMint,
        targetMint,
        goLiveUnixTime
      })

  }

  throw new Error("Curve not found");
}

export interface IPricingCurve {
  current(unixTime?: number): number;
  locked(): number;
  sellTargetAmount(
    targetAmountNum: number,
    baseRoyaltiesPercent: number,
    targetRoyaltiesPercent: number,
    unixTime?: number
  ): number;
  buyTargetAmount(
    targetAmountNum: number,
    baseRoyaltiesPercent: number,
    targetRoyaltiesPercent: number,
    unixTime?: number
  ): number;
  buyWithBaseAmount(
    baseAmountNum: number,
    baseRoyaltiesPercent: number,
    targetRoyaltiesPercent: number,
    unixTime?: number
  ): number;
  buyWithBaseRootEstimates(
    baseAmountNum: number,
    baseRoyaltiesPercent: number,
    unixTime?: number
  ): number[];
  buyTargetAmountRootEstimates(
    targetAmountNum: number,
    targetRoyaltiesPercent: number,
    unixTime?: number
  ): number[];
}

type TimeCurveArgs = {
  curve: any,
  baseStorage: AccountInfo;
  baseMint: MintInfo;
  targetMint: MintInfo;
  goLiveUnixTime: number;
}

export class TimeCurve implements IPricingCurve {
  curve: any;
  baseStorage: AccountInfo;
  baseMint: MintInfo;
  targetMint: MintInfo;
  goLiveUnixTime: number;

  constructor({
    curve,
    baseStorage,
    baseMint,
    targetMint,
    goLiveUnixTime
  }: TimeCurveArgs) {
    this.curve = curve;
    this.baseStorage = baseStorage;
    this.baseMint = baseMint;
    this.targetMint = targetMint;
    this.goLiveUnixTime = goLiveUnixTime;
  }

  currentCurve(unixTime: number = (new Date().valueOf() / 1000)): IPricingCurve {
    let subCurve; 
    if (unixTime < this.goLiveUnixTime) {
      subCurve = this.curve.definition.timeV0.curves[0].curve.exponentialCurveV0
    } else {
      subCurve = [...this.curve.definition.timeV0.curves].reverse().find((c: any) => unixTime >= this.goLiveUnixTime + c.offset.toNumber()).curve.exponentialCurveV0
    }

    return new ExponentialCurve(
      subCurve as ExponentialCurveV0,
      this.baseStorage,
      this.baseMint,
      this.targetMint
    );
  }

  current(unixTime?: number): number {
    return this.currentCurve(unixTime).current(unixTime);
  }

  locked(): number {
    return this.currentCurve().locked();
  }
  sellTargetAmount(targetAmountNum: number, baseRoyaltiesPercent: number, targetRoyaltiesPercent: number, unixTime?: number): number {
    return this.currentCurve(unixTime).sellTargetAmount(targetAmountNum, baseRoyaltiesPercent, targetRoyaltiesPercent);
  }
  buyTargetAmount(targetAmountNum: number, baseRoyaltiesPercent: number, targetRoyaltiesPercent: number, unixTime?: number): number {
    return this.currentCurve(unixTime).buyTargetAmount(targetAmountNum, baseRoyaltiesPercent, targetRoyaltiesPercent);
  }
  buyWithBaseAmount(baseAmountNum: number, baseRoyaltiesPercent: number, targetRoyaltiesPercent: number, unixTime?: number): number {
    return this.currentCurve(unixTime).buyWithBaseAmount(baseAmountNum, baseRoyaltiesPercent, targetRoyaltiesPercent);
  }
  buyWithBaseRootEstimates(baseAmountNum: number, baseRoyaltiesPercent: number, unixTime?: number): number[] {
    return this.currentCurve(unixTime).buyWithBaseRootEstimates(baseAmountNum, baseRoyaltiesPercent);
  }
  buyTargetAmountRootEstimates(targetAmountNum: number, targetRoyaltiesPercent: number, unixTime?: number): number[] {
    return this.currentCurve(unixTime).buyTargetAmountRootEstimates(targetAmountNum, targetRoyaltiesPercent);
  }
}

export class ExponentialCurve implements IPricingCurve {
  c: number;
  b: number;
  k: number;
  pow: number;
  frac: number;
  baseStorage: AccountInfo;
  baseMint: MintInfo;
  targetMint: MintInfo;

  constructor(
    curve: ExponentialCurveV0,
    baseStorage: AccountInfo,
    baseMint: MintInfo,
    targetMint: MintInfo
  ) {
    this.c = curve.c.toNumber() / 1000000000000;
    this.b = curve.b.toNumber() / 1000000000000;
    this.k = curve.pow / curve.frac;
    this.pow = curve.pow;
    this.frac = curve.frac;

    this.baseStorage = baseStorage;
    this.baseMint = baseMint;
    this.targetMint = targetMint;
  }

  buyWithBaseRootEstimates(
    baseAmountNum: number,
    baseRoyaltiesPercent: number
  ): number[] {
    const S = supplyAsNum(this.targetMint);
    const R = amountAsNum(this.baseStorage.amount, this.baseMint);
    const dR = baseAmountNum * (1 - asDecimal(baseRoyaltiesPercent));

    if (R == 0 || S == 0) {
      return [Math.pow((dR * (1 + this.k)) / this.c, 1 / (1 + this.k)), 1];
    } else {
      /*
        dS = -S + ((S^(1 + k) (R + dR))/R)^(1/(1 + k))
      */

      return [
        Math.pow(S, 1 + this.k),
        Math.pow((Math.pow(S, 1 + this.k) * (R + dR)) / R, 1 / (1 + this.k)),
      ];
    }
  }

  buyTargetAmountRootEstimates(
    targetAmountNum: number,
    targetRoyaltiesPercent: number
  ): number[] {
    const S = supplyAsNum(this.targetMint);
    const dS = targetAmountNum * (1 / (1 - asDecimal(targetRoyaltiesPercent)));
    const R = amountAsNum(this.baseStorage.amount, this.baseMint);

    if (R == 0 || S == 0) {
      return [Math.pow(dS, 1 + this.k), 1];
    } else {
      /*
        (R / S^(1 + k)) ((S + dS)^(1 + k) - S^(1 + k))
      */

      return [Math.pow(S, 1 + this.k), Math.pow(S + dS, 1 + this.k)];
    }
  }

  current(): number {
    return this.changeInTargetAmount(1, 0, 0);
  }

  locked(): number {
    return amountAsNum(this.baseStorage.amount, this.baseMint);
  }

  changeInTargetAmount(
    targetAmountNum: number,
    baseRoyaltiesPercent: number,
    targetRoyaltiesPercent: number
  ): number {
    const R = amountAsNum(this.baseStorage.amount, this.baseMint);
    const S = supplyAsNum(this.targetMint);
    
    // Calculate with the actual target amount they will need to get the target amount after royalties
    const dS = targetAmountNum * (1 / (1 - asDecimal(targetRoyaltiesPercent)));

    if (R == 0 || S == 0) {
      // b dS + (c dS^(1 + k))/(1 + k)
      return (
        (this.b * dS + (this.c * Math.pow(dS, 1 + this.k)) / (1 + this.k)) *
        (1 / (1 - asDecimal(baseRoyaltiesPercent)))
      );
    } else {
      if (this.b == 0 && this.c != 0) {
        /*
          (R / S^(1 + k)) ((S + dS)(S + dS)^k - S^(1 + k))
        */
        return (
          ((R / Math.pow(S, 1 + this.k)) *
            ((S + dS) * Math.pow(S + dS, this.k) - Math.pow(S, 1 + this.k))) /
          (1 - asDecimal(baseRoyaltiesPercent))
        );
      } else if (this.c == 0) {
        // R dS / S
        return ((R * dS) / S) * (1 / (1 - asDecimal(baseRoyaltiesPercent)));
      } else {
        throw new Error(
          "Cannot convert base amount to target amount when both b and k are defined on an exponential curve. The math is too hard"
        );
      }
    }
  }

  sellTargetAmount(
    targetAmountNum: number,
    baseRoyaltiesPercent: number,
    targetRoyaltiesPercent: number
  ): number {
    return -this.changeInTargetAmount(
      -targetAmountNum,
      baseRoyaltiesPercent,
      targetRoyaltiesPercent
    );
  }

  buyTargetAmount(
    targetAmountNum: number,
    baseRoyaltiesPercent: number,
    targetRoyaltiesPercent: number
  ): number {
    return this.changeInTargetAmount(
      targetAmountNum,
      baseRoyaltiesPercent,
      targetRoyaltiesPercent
    );
  }

  buyWithBaseAmount(
    baseAmountNum: number,
    baseRoyaltiesPercent: number,
    targetRoyaltiesPercent: number
  ): number {
    const dR = baseAmountNum * (1 - asDecimal(baseRoyaltiesPercent));
    if (
      this.baseStorage.amount.toNumber() == 0 ||
      this.targetMint.supply.toNumber() == 0
    ) {
      if (this.b == 0) {
        /*
         * -S + (((1 + k) dR)/c)^(1/(1 + k))
         */
        return (
          (Math.pow(((1 + this.k) * dR) / this.c, 1 / (1 + this.k)) -
            supplyAsNum(this.targetMint)) *
          (1 - asDecimal(targetRoyaltiesPercent))
        );
      } else if (this.c == 0) {
        return (dR / this.b) * (1 - asDecimal(targetRoyaltiesPercent));
      }

      throw new Error(
        "Cannot convert base amount to target amount when both b and k are defined on an exponential curve. The math is too hard"
      );
    } else {
      const R = amountAsNum(this.baseStorage.amount, this.baseMint);
      const S = supplyAsNum(this.targetMint);
      if (this.b == 0) {
        /*
         * dS = -S + ((S^(1 + k) (R + dR))/R)^(1/(1 + k))
         */
        return (
          (-S +
            Math.pow(
              (Math.pow(S, 1 + this.k) * (R + dR)) / R,
              1 / (1 + this.k)
            )) *
          (1 - asDecimal(targetRoyaltiesPercent))
        );
      } else if (this.c == 0) {
        // dS = S dR / R
        return ((S * dR) / R) * (1 - asDecimal(targetRoyaltiesPercent));
      } else {
        throw new Error(
          "Cannot convert base amount to target amount when both b and k are defined on an exponential curve. The math is too hard"
        );
      }
    }
  }
}
