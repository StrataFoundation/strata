export * from "./truthy";
export * from "./getUserTokenAccounts";
export * as NameService from "./nameServiceTwitter";

export function roundToDecimals(num: number, decimals: number): number {
  return Math.trunc(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}