import { Connection, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { Order } from "@project-serum/serum/lib/market";
import { Market } from "@project-serum/serum";
import { useConnection } from "@solana/wallet-adapter-react";

const SERUM_PROGRAM_ID = new PublicKey(
  "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
);

export const useMarketPrice = (
  marketAddress: PublicKey
): number | undefined => {
  const { connection } = useConnection();
  const [price, setPrice] = useState<number>();
  useEffect(() => {
    const fetch = async () => {
      try {
        let market = await Market.load(
          connection,
          marketAddress,
          undefined,
          SERUM_PROGRAM_ID
        );
        const book = await market.loadAsks(connection);
        const top = book.items(false).next().value as Order;
        setPrice(top.price);
      } catch (e) {
        console.error(e);
      }
    };

    fetch();

    const interval = setInterval(fetch, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  return price;
};
