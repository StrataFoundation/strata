import axios from "axios";
import { useState } from "react";
import { useInterval } from "./useInterval";
import LRU from "lru-cache";
import { PublicKey } from "@solana/web3.js";
import { useMint } from "./useMint";
import { useTwWrappedSolMint } from "./useTwWrappedSolMint";
import { NATIVE_MINT } from "@solana/spl-token";

const lru = new LRU({
  ttl: 1000 * 60 * 2,
  ttlAutopurge: true
});

export async function getJupiterPriceCached(
  inputMint: PublicKey | undefined,
  priceMint: PublicKey | undefined,
  inputDecimals: number | undefined,
  priceDecimals: number | undefined
): Promise<number | undefined> {
  if (!inputMint || !priceMint || typeof inputDecimals === "undefined" || typeof priceDecimals === "undefined") {
    return;
  }
  let key = inputMint.toBase58() + priceMint.toBase58();

  if (!lru.has(key)) {
    const resp = await axios(
      `https://quote-api.jup.ag/v1/quote?inputMint=${inputMint}&outputMint=${priceMint}&amount=${
        1 * Math.pow(10, inputDecimals)
      }&slippage=0.5&feeBps=4`
    );
    if (!resp.data.error) {
      const data = resp.data.data[0];
      const result =
        data &&
        data.outAmount /
          Math.pow(10, priceDecimals) /
          (data.inAmount / Math.pow(10, inputDecimals));
      if (result) {
        lru.set(key, result);
      }
    }
  }

  return lru.get(key);
}

export const useJupiterPrice = (
  inputMint: PublicKey | undefined,
  priceMint: PublicKey | undefined
): number | undefined => {
  const [price, setPrice] = useState<number>();
  const input = useMint(inputMint);
  const output = useMint(priceMint);
  const wrappedSolMint = useTwWrappedSolMint();

  useInterval(
    () => {
      if (wrappedSolMint && inputMint && priceMint) {
        getJupiterPriceCached(
          inputMint.equals(wrappedSolMint) ? NATIVE_MINT : inputMint,
          priceMint.equals(wrappedSolMint) ? NATIVE_MINT : priceMint,
          inputMint.equals(NATIVE_MINT) ? 9 : input?.decimals,
          priceMint.equals(NATIVE_MINT) ? 9 : output?.decimals
        )
          ?.then((p) => setPrice(p))
          .catch(console.log);
      }
    },
    2 * 60 * 1000,
    [input, output, inputMint, priceMint, wrappedSolMint]
  );

  return price;
};
