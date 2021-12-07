import { MintInfo, u64 } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  BondingPricing, ITokenBonding,
  SplTokenBonding
} from "@strata-foundation/spl-token-bonding";
import React, { useEffect, useMemo, useState } from "react";
import { useAsync } from "react-async-hook";
import { useStrataSdks } from "./index";
import { useAccount } from "./useAccount";
import { useAssociatedAccount } from "./useAssociatedAccount";
import { useMint } from "./useMint";


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
  wallet: PublicKey | undefined | null,
  token: PublicKey | undefined | null
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
  token: PublicKey | undefined | null
): number | undefined {
  const { publicKey } = useWallet();
  return useUserOwnedAmount(publicKey || undefined, token);
}

export interface PricingState {
  loading: boolean;
  tokenBonding?: ITokenBonding;
  pricing?: BondingPricing;
  error?: Error;
}
/**
 * Get an {@link IPricingCurve} Object that can estimate pricing on this bonding curve,
 * in real time.
 *
 * @param tokenBonding
 * @returns
 */
export function useBondingPricing(
  tokenBonding: PublicKey | undefined | null
): PricingState {
  const { tokenBondingSdk } = useStrataSdks();
  const getPricing = async (tokenBondingSdk: SplTokenBonding | undefined, key: PublicKey | null | undefined) => tokenBondingSdk && key && tokenBondingSdk.getPricing(key)

  const { result: pricing, loading, error } = useAsync(getPricing, [tokenBondingSdk, tokenBonding]);
  const tokenBondingAcct = useMemo(() => pricing?.hierarchy?.tokenBonding, [pricing]);

  return {
    pricing: pricing || undefined,
    tokenBonding: tokenBondingAcct,
    loading,
    error
  };
}

const tokenBondingKey = async (mint: PublicKey | undefined | null, index: number): Promise<PublicKey | null | undefined> =>
  mint && (await SplTokenBonding.tokenBondingKey(mint, index))[0];

/**
 * Same as {@link useBondingPricing}, just from a mint instead of the token bonding key
 *
 * @param mint
 * @param index
 * @returns
 */
export function useBondingPricingFromMint(
  mint: PublicKey | undefined | null,
  index?: number | undefined
): PricingState {
  const { result: key, loading } = useAsync(
    tokenBondingKey,
    [mint, index || 0]
  );
  const bondingPricing = useBondingPricing(key);

  return {
    ...bondingPricing,
    loading: bondingPricing.loading || loading,
  };
}
