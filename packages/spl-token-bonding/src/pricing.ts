import { MintInfo, u64 } from "@solana/spl-token";
// @ts-ignore
import { gsl_sf_lambert_W0 } from "./lambertw";
import BN from "bn.js";

export type LogCurveV0 = {
  g: BN,
  c: BN,
  taylorIterations: number
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

export const startFinishLogCurve =
  (curve: LogCurveV0) => (start: number, finish: number) => {
    const c = curve.c.toNumber() / 1000000000000;
    const g = curve.g.toNumber() / 1000000000000;

    return logCurveRange(c, g, start, finish);
  };

export const targetToBaseLogCurve =
  (curve: LogCurveV0, target: MintInfo, baseRoyaltiesPercent: number, targetRoyaltiesPercent: number) =>
  (targetAmount: number): number => {
    const targetRoyaltiesDecimal = asDecimal(targetRoyaltiesPercent);
    const price = startFinishLogCurve(curve)(
      supplyAsNum(target),
      supplyAsNum(target) + targetAmount * (1 + targetRoyaltiesDecimal)
    );
    return price * (1 + asDecimal(baseRoyaltiesPercent));
  };

  /*
  Just accept the magic...
  This might help if you can't
  https://www.wolframalpha.com/input/?i=solve%5Bc*%281%2Fg+%2B+%28s+%2B+x%29%29+*+log%28g+*+%28s+%2B+x%29+%2B+1%29+-+c+*+%28s+%2B+x%29+%3D+k%2C+x%5D
*/
export const baseToTargetLogCurve =
  (curve: LogCurveV0, target: MintInfo, baseRoyaltiesPercent: number, targetRoyaltiesPercent: number) =>
    (baseAmount: number): number => {
      const royaltySubtractedBaseAmount = baseAmount * (1 - asDecimal(baseRoyaltiesPercent));
      const c = curve.c.toNumber() / 1000000000000;
      const g = curve.g.toNumber() / 1000000000000;
      const s = supplyAsNum(target);
      const rewardsDecimal = asDecimal(targetRoyaltiesPercent);
      const k = royaltySubtractedBaseAmount + generalLogCurve(c, g, s);
      const exp = gsl_sf_lambert_W0((g * k - c) / (c * Math.E)) + 1;

      return Math.abs((Math.pow(Math.E, exp) - g * s - 1) / ((1 + rewardsDecimal) * g));
    };