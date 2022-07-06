import BN from "bn.js";
import { MintInfo, u64 } from "@solana/spl-token";

export type Truthy<T> = T extends false | "" | 0 | null | undefined ? never : T; // from lodash

export const truthy = <T>(value: T): value is Truthy<T> => !!value;

export function toNumber(numberOrBn: BN | number, mint: MintInfo): number {
  if (BN.isBN(numberOrBn)) {
    return amountAsNum(numberOrBn, mint);
  } else {
    return numberOrBn;
  }
}

export function amountAsNum(amount: u64, mint: MintInfo): number {
  const decimals = new u64(Math.pow(10, mint.decimals).toString());
  const decimal = amount.mod(decimals).toNumber() / decimals.toNumber();
  return amount.div(decimals).toNumber() + decimal;
}

export function toBN(
  numberOrBn: BN | number,
  mintOrDecimals: MintInfo | number
): BN {
  const decimals: number =
    typeof mintOrDecimals === "number"
      ? mintOrDecimals
      : (mintOrDecimals as MintInfo).decimals;

  if (BN.isBN(numberOrBn)) {
    return numberOrBn;
  } else {
    return new BN(
      Math.ceil(Number(numberOrBn) * Math.pow(10, decimals)).toLocaleString(
        "fullwide",
        { useGrouping: false }
      )
    );
  }
}

export function supplyAsNum(mint: MintInfo): number {
  return amountAsNum(mint.supply, mint);
}

export function numberWithCommas(x: number, decimals: number = 4): string {
  return roundToDecimals(x, decimals).toLocaleString("en-US", {
    maximumFractionDigits: decimals,
  });
}

export function roundToDecimals(num: number, decimals: number): number {
  return Math.trunc(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}


export function humanReadable(bn: BN, mint: MintInfo): string {
  return numberWithCommas(
    roundToDecimals(toNumber(bn, mint), mint.decimals)
  );
}
