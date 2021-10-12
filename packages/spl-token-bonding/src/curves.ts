import { MintInfo, u64 } from "@solana/spl-token";
// @ts-ignore
import { gsl_sf_lambert_W0 } from "./lambertw";
import BN from "bn.js";

export type LogCurveV0 = {
  g: BN,
  c: BN,
  taylorIterations: number
}

export type ExponentialCurveV0 = {
  a: BN,
  b: BN
}

export type FixedPriceCurveV0 = {
  price: BN
}

export type ConstantProductCurveV0 = {
  b: BN,
  m: BN
}

function generalLogCurve(c: number, g: number, x: number): number {
  return c * ((1 / g + x) * Math.log(1 + g * x) - x);
}
/// Integral of c * log(1 + g * x) dx from a to b
/// https://www.wolframalpha.com/input/?i=c+*+log%281+%2B+g+*+x%29+dx
function logCurveRange(c: number, g: number, a: number, b: number): number {
  return generalLogCurve(c, g, b) - generalLogCurve(c, g, a);
}

export function supplyAsNum(mint: MintInfo): number {
  return amountAsNum(mint.supply, mint);
}

export function asDecimal(percent: number): number {
  return percent / 4294967295 // uint32 max value
}


export function amountAsNum(amount: u64, mint: MintInfo): number {
  const decimals = new u64(Math.pow(10, mint.decimals).toString());
  const decimal = amount.mod(decimals).toNumber() / decimals.toNumber();
  return amount.div(decimals).toNumber() + decimal;
}

export function fromCurve(curve: any, baseMint: MintInfo, targetMint: MintInfo): Curve {
  switch (Object.keys(curve.curve)[0]) {
    case "logCurveV0": 
      return new LogCurve(curve.curve.logCurveV0 as LogCurveV0, baseMint, targetMint)
    case "constantProductCurveV0": 
      return new ConstantProductCurve(curve.curve.constantProductCurveV0 as ConstantProductCurveV0, baseMint, targetMint)
    case "exponentialCurveV0": 
      return new ExponentialCurve(curve.curve.exponentialCurveV0 as ExponentialCurveV0, baseMint, targetMint)
    case "fixedPriceCurveV0":
      return new FixedPriceCurve(curve.curve.fixedPriceCurveV0 as FixedPriceCurveV0, baseMint, targetMint);
  }

  throw new Error("Curve not found")
}

export interface Curve {
  current(): number
  locked(): number
  sellTargetAmount(targetAmountNum: number): number
  buyTargetAmount(targetAmountNum: number, baseRoyaltiesPercent: number, targetRoyaltiesPercent: number): number
  buyWithBaseAmount(baseAmountNum: number, baseRoyaltiesPercent: number, targetRoyaltiesPercent: number): number
}

export class LogCurve implements LogCurveV0, Curve {
  g: BN;
  c: BN;
  taylorIterations: number;
  baseMint: MintInfo;
  targetMint: MintInfo;

  constructor(curve: LogCurveV0, baseMint: MintInfo, targetMint: MintInfo) {
    this.g = curve.g;
    this.c = curve.c;
    this.taylorIterations = curve.taylorIterations;
    this.baseMint = baseMint;
    this.targetMint = targetMint;
  }

  locked(): number {
    const c = this.c.toNumber() / 1000000000000;
    const g = this.g.toNumber() / 1000000000000;

    return logCurveRange(c, g, 0, supplyAsNum(this.targetMint));
  }

  current(): number {
    const c = this.c.toNumber() / 1000000000000;
    const g = this.g.toNumber() / 1000000000000;
    return c *
      Math.log(
        1 + (g * supplyAsNum(this.targetMint))
      );
  }

  startFinish(start: number, finish: number) {
    const c = this.c.toNumber() / 1000000000000;
    const g = this.g.toNumber() / 1000000000000;

    return logCurveRange(c, g, start, finish);
  }

  sellTargetAmount(targetAmountNum: number): number {
    return this.startFinish(supplyAsNum(this.targetMint) - targetAmountNum, supplyAsNum(this.targetMint));
  }

  buyTargetAmount(targetAmountNum: number, baseRoyaltiesPercent: number, targetRoyaltiesPercent: number): number {
    const targetRoyaltiesDecimal = asDecimal(targetRoyaltiesPercent);
    const price = this.startFinish(
      supplyAsNum(this.targetMint),
      supplyAsNum(this.targetMint) + targetAmountNum * (1 / (1 - targetRoyaltiesDecimal))
    );
    return price * (1 + asDecimal(baseRoyaltiesPercent));
  }


  /*
    Just accept the magic...
    This might help if you can't
    https://www.wolframalpha.com/input/?i=solve%5Bc*%281%2Fg+%2B+%28s+%2B+x%29%29+*+log%28g+*+%28s+%2B+x%29+%2B+1%29+-+c+*+%28s+%2B+x%29+%3D+k%2C+x%5D
  */
  buyWithBaseAmount(baseAmountNum: number, baseRoyaltiesPercent: number, targetRoyaltiesPercent: number): number {
    const baseRewardsDecimal = (1 / (1 - asDecimal(baseRoyaltiesPercent))) - 1;
    const royaltySubtractedBaseAmount = baseAmountNum * (1 - baseRewardsDecimal);
    const c = this.c.toNumber() / 1000000000000;
    const g = this.g.toNumber() / 1000000000000;
    const s = supplyAsNum(this.targetMint);
    const rewardsDecimal = asDecimal(targetRoyaltiesPercent);
    const k = royaltySubtractedBaseAmount + generalLogCurve(c, g, s);
    const exp = gsl_sf_lambert_W0((g * k - c) / (c * Math.E)) + 1;
    const numerator = (Math.pow(Math.E, exp) - g * s - 1);
    const denominator = ((1 + rewardsDecimal) * g);

    return Math.abs(numerator / denominator);
  }
}

export class ExponentialCurve implements ExponentialCurveV0, Curve {
  a: BN;
  b: BN;
  baseMint: MintInfo;
  targetMint: MintInfo;

  constructor(curve: ExponentialCurveV0, baseMint: MintInfo, targetMint: MintInfo) {
    this.a = curve.a;
    this.b = curve.b;
    this.baseMint = baseMint;
    this.targetMint = targetMint;
  }
  current(): number {
    throw new Error("Method not implemented.");
  }
  locked(): number {
    throw new Error("Method not implemented.");
  }

  startFinish(start: number, finish: number) {
    const a = this.a.toNumber() / 1_000000000000;
    const b = this.b.toNumber() / 1_000000000000;

    // Integrate from supply to supply + amount -- ab^x + C
    // a*(b^(supply + amount) - b^(supply)))
    return a * (Math.pow(b, finish) - Math.pow(b, start));
  }

  sellTargetAmount(targetAmountNum: number): number {
    return this.startFinish(supplyAsNum(this.targetMint) - targetAmountNum, supplyAsNum(this.targetMint));
  }

  buyTargetAmount(targetAmountNum: number, baseRoyaltiesPercent: number, targetRoyaltiesPercent: number): number {
    const targetRoyaltiesDecimal = asDecimal(targetRoyaltiesPercent);
    const price = this.startFinish(
      supplyAsNum(this.targetMint),
      supplyAsNum(this.targetMint) + targetAmountNum * (1 / (1 - targetRoyaltiesDecimal))
    );
    return price * (1 + asDecimal(baseRoyaltiesPercent));
  }

  /*
  Inverse is log_b(x)
   x ∙ ( log_b(x) - 1 / ln(b) ) 
  */
  buyWithBaseAmount(baseAmountNum: number, baseRoyaltiesPercent: number, targetRoyaltiesPercent: number): number {
    throw new Error("Not implemented because we don't need it yet");
  }
}


export class FixedPriceCurve implements FixedPriceCurveV0, Curve {
  price: BN;
  baseMint: MintInfo;
  targetMint: MintInfo;

  constructor(curve: FixedPriceCurveV0, baseMint: MintInfo, targetMint: MintInfo) {
    this.price = curve.price;
    this.baseMint = baseMint;
    this.targetMint = targetMint;
  }

  current(): number {
    return this.priceNum
  }

  locked(): number {
    return this.priceNum * supplyAsNum(this.targetMint)
  }

  get priceNum() {
    return this.price.toNumber() / 1000000000000;
  }

  sellTargetAmount(targetAmountNum: number): number {
    return targetAmountNum * this.priceNum;
  }

  buyTargetAmount(targetAmountNum: number, baseRoyaltiesPercent: number, targetRoyaltiesPercent: number): number {
    const targetRoyaltiesDecimal = asDecimal(targetRoyaltiesPercent);
    const price = targetAmountNum * (1 / (1 - targetRoyaltiesDecimal)) * this.priceNum;
    return price * (1 + asDecimal(baseRoyaltiesPercent));
  }

  buyWithBaseAmount(baseAmountNum: number, baseRoyaltiesPercent: number, targetRoyaltiesPercent: number): number {
    const baseAfterTax = baseAmountNum * (1 - asDecimal(baseRoyaltiesPercent));
    const theoreticalTarget = baseAfterTax / this.priceNum;
    const targetAfterTax = theoreticalTarget * (1 - asDecimal(targetRoyaltiesPercent));

    return targetAfterTax;
  }
}

export class ConstantProductCurve implements ConstantProductCurveV0, Curve {
  b: BN;
  m: BN;
  baseMint: MintInfo;
  targetMint: MintInfo;

  constructor(curve: ConstantProductCurveV0, baseMint: MintInfo, targetMint: MintInfo) {
    this.m = curve.m;
    this.b = curve.b;
    this.baseMint = baseMint;
    this.targetMint = targetMint;
  }
  current(): number {
    throw new Error("Method not implemented.");
  }
  locked(): number {
    throw new Error("Method not implemented.");
  }

  startFinish(start: number, finish: number) {
    const m = this.m.toNumber() / 1_000000000000;
    const b = this.b.toNumber() / 1_000000000000;

    return (m * (Math.pow(finish, 2)) / 2) + (b * finish) -
      (m * (Math.pow(start, 2)) / 2) + (b * start)
  }

  sellTargetAmount(targetAmountNum: number): number {
    return this.startFinish(supplyAsNum(this.targetMint) - targetAmountNum, supplyAsNum(this.targetMint));
  }

  buyTargetAmount(targetAmountNum: number, baseRoyaltiesPercent: number, targetRoyaltiesPercent: number): number {
    const targetRoyaltiesDecimal = asDecimal(targetRoyaltiesPercent);
    const price = this.startFinish(
      supplyAsNum(this.targetMint),
      supplyAsNum(this.targetMint) + targetAmountNum * (1 / (1 - targetRoyaltiesDecimal))
    );
    return price * (1 + asDecimal(baseRoyaltiesPercent));
  }

  buyWithBaseAmount(baseAmountNum: number, baseRoyaltiesPercent: number, targetRoyaltiesPercent: number): number {
    throw new Error("Not implemented because we don't need it yet");
  }
}

