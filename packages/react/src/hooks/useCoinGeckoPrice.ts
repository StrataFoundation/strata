import axios from "axios";
import { useState } from "react";
import { useInterval } from "./useInterval";

export async function getCoinGeckoPriceUsd(
  tokenName: string = "solana"
): Promise<number | undefined> {
  let searchName = tokenName.toLowerCase();
  // Some mappings
  if (searchName === "grape") {
    searchName = "grape-2"
  }

  const resp = await axios(
    `https://api.coingecko.com/api/v3/simple/price?ids=${searchName}&vs_currencies=usd`
  );
  const result = resp.data[searchName];
  if (result) {
    return result.usd
  }
}

export const useCoinGeckoPrice = (tokenName: string = "solana"): number | undefined => {
  const [price, setPrice] = useState<number>();

  useInterval(() => {
    getCoinGeckoPriceUsd(tokenName)?.then(p => setPrice(p)).catch(console.log);
  }, 2 * 60 * 1000);

  return price;
};
