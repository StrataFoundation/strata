import BN from "bn.js";
import { MintInfo } from "@solana/spl-token";

export type Truthy<T> = T extends false | "" | 0 | null | undefined ? never : T; // from lodash

export const truthy = <T>(value: T): value is Truthy<T> => !!value;

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
