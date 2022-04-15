import { MintInfo, u64 } from "@solana/spl-token";
import BN from "bn.js";

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

export function toNumber(numberOrBn: BN | number, mint: MintInfo): number {
  if (BN.isBN(numberOrBn)) {
    return amountAsNum(numberOrBn, mint);
  } else {
    return numberOrBn;
  }
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

export function amountAsNum(amount: u64, mint: MintInfo): number {
  const decimals = new u64(Math.pow(10, mint.decimals).toString());
  const decimal = amount.mod(decimals).toNumber() / decimals.toNumber();
  return amount.div(decimals).toNumber() + decimal;
}

export function supplyAsNum(mint: MintInfo): number {
  return amountAsNum(mint.supply, mint);
}

export function asDecimal(percent: number): number {
  return percent / 4294967295; // uint32 max value
}
