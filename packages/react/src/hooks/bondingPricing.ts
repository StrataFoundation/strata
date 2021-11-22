import { Market } from "@project-serum/serum";
import { Order } from "@project-serum/serum/lib/market";
import { MintInfo, u64 } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  fromCurve,
  IPricingCurve,
  SplTokenBonding,
} from "@strata-foundation/spl-token-bonding";
import React, { useEffect, useMemo, useState } from "react";
import { useAsync } from "react-async-hook";
import { useCurve, useSolPrice, useTokenBonding } from ".";
import { useAccount } from "./useAccount";
import { useAssociatedAccount } from "./useAssociatedAccount";
import { useMint } from "./useMint";
import { useStrataSdks } from "./useStrataSdks";
import { useTokenAccount } from "./useTokenAccount";

const SERUM_PROGRAM_ID = new PublicKey(
  "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
);

const SOL_TOKEN = new PublicKey("So11111111111111111111111111111111111111112");

// TODO: Use actual connection. But this can't happen in dev
let connection = new Connection("https://api.mainnet-beta.solana.com");

export function supplyAsNum(mint: MintInfo): number {
  return amountAsNum(mint.supply, mint);
}

export function amountAsNum(amount: u64, mint: MintInfo): number {
  const decimals = new u64(Math.pow(10, mint.decimals).toString());
  const decimal = amount.mod(decimals).toNumber() / decimals.toNumber();
  return amount.div(decimals).toNumber() + decimal;
}

export function useSolOwnedAmount(): { amount: number; loading: boolean } {
  const { publicKey } = useWallet();
  const { info: lamports, loading } = useAccount<number>(
    publicKey || undefined,
    (_, account) => account.lamports
  );
  const result = React.useMemo(
    () => (lamports || 0) / Math.pow(10, 9),
    [lamports]
  );

  return {
    amount: result,
    loading,
  };
}

export function useUserOwnedAmount(
  wallet: PublicKey | undefined,
  token: PublicKey | undefined
): number | undefined {
  const { associatedAccount } = useAssociatedAccount(wallet, token);
  const mint = useMint(token);
  const [amount, setAmount] = useState<number>();

  useEffect(() => {
    if (mint && associatedAccount) {
      setAmount(amountAsNum(associatedAccount.amount, mint));
    }
  }, [associatedAccount, mint]);

  return amount && Number(amount);
}

export function useOwnedAmount(
  token: PublicKey | undefined
): number | undefined {
  const { publicKey } = useWallet();
  return useUserOwnedAmount(publicKey || undefined, token);
}

export interface PricingState {
  loading: boolean;
  curve?: IPricingCurve;
}
/**
 * Get an {@link IPricingCurve} Object that can estimate pricing on this bonding curve,
 * in real time.
 *
 * @param tokenBonding
 * @returns
 */
export function useBondingPricing(
  tokenBonding: PublicKey | undefined
): PricingState {
  const { info: bonding, loading: bondingLoading } =
    useTokenBonding(tokenBonding);
  const { info: curve, loading: curveLoading } = useCurve(bonding?.curve);

  const base = useMint(bonding?.baseMint);
  const target = useMint(bonding?.targetMint);
  const { info: baseStorage } = useTokenAccount(bonding?.baseStorage);
  const pricing = useMemo(
    () =>
      curve &&
      base &&
      target &&
      baseStorage &&
      fromCurve(curve, baseStorage, base, target),
    [curve, baseStorage, base, target]
  );
  const loading = useMemo(
    () => curveLoading || bondingLoading,
    [curveLoading, bondingLoading]
  );

  return {
    curve: pricing,
    loading,
  };
}

/**
 * Same as {@link useBondingPricing}, just from a mint instead of the token bonding key
 *
 * @param mint
 * @param index
 * @returns
 */
export function useBondingPricingFromMint(
  mint: PublicKey | undefined,
  index?: number | undefined
): PricingState {
  const { result: key, loading } = useAsync(
    async (mint: PublicKey | undefined, index: number) =>
      mint && SplTokenBonding.tokenBondingKey(mint, index),
    [mint, index || 0]
  );
  const bondingPricing = useBondingPricing(key && key[0]);

  return {
    ...bondingPricing,
    loading: bondingPricing.loading || loading,
  };
}

export const useMarketPrice = (
  marketAddress: PublicKey
): number | undefined => {
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

export function useFiatPrice(token: PublicKey | undefined): number | undefined {
  const solPrice = useSolPrice();
  const { curve } = useBondingPricingFromMint(token);

  const [price, setPrice] = useState<number>();

  useEffect(() => {
    if (token?.toBase58() == SOL_TOKEN.toBase58()) {
      setPrice(solPrice);
    } else {
      // TODO: This is not in sol, so not correct
      setPrice(curve?.current());
    }
  }, [token, solPrice, curve]);

  return price;
}
