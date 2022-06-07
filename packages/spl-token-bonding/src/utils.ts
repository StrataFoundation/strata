import BN from "bn.js";
import {
  toBN as toBNUtils,
  toNumber as toNumberUtils,
  amountAsNum as amountAsNumUtils,
  supplyAsNum as supplyAsNumUtils,
} from "@strata-foundation/spl-utils";

/**
 * Convert a number to a string avoiding scientific notation
 * @param n
 * @returns
 */
function toFixedSpecial(num: number, n: number): string {
  var str = num.toFixed(n);
  if (str.indexOf("e+") === -1) return str;

  // if number is in scientific notation, pick (b)ase and (p)ower
  str = str
    .replace(".", "")
    .split("e+")
    .reduce(function (b: any, p: any) {
      // @ts-ignore
      return b + Array(p - b.length + 2).join(0);
    });

  if (n > 0) {
    // @ts-ignore
    str += "." + Array(n + 1).join(0);
  }

  return str;
}

/**
 * Convert a number to a 12 decimal fixed precision u128
 *
 * @param num Number to convert to a 12 decimal fixed precision BN
 * @returns
 */
export function toU128(num: number | BN): BN {
  if (BN.isBN(num)) {
    return num;
  }

  if (num == Infinity) {
    return new BN(0);
  }

  try {
    return new BN(toFixedSpecial(num, 12).replace(".", ""));
  } catch (e: any) {
    console.error(`Error converting ${num} to U128`);
    return new BN(0);
  }
}

export const toNumber = toNumberUtils;

export const toBN = toBNUtils;

export const amountAsNum = amountAsNumUtils;

export const supplyAsNum = supplyAsNumUtils;

export function asDecimal(percent: number): number {
  return percent / 4294967295; // uint32 max value
}
