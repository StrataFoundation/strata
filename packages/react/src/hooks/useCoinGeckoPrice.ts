import axios from "axios";
import { useState } from "react";
import { useInterval } from "./useInterval";

export const useCoinGeckoPrice = (): number | undefined => {
  const [price, setPrice] = useState<number>();

  useInterval(() => {
    axios(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    )
      .then((response) => setPrice(response.data.solana.usd))
      .catch((e) => console.log(e));
  }, 2 * 60 * 1000);

  return price;
};
