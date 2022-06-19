import { MintInfo, NATIVE_MINT, u64 } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  BondingPricing,
  ITokenBonding,
  SplTokenBonding,
} from "@strata-foundation/spl-token-bonding";
import { useTokenAccount, useTokenBonding } from "./index";
import React, { useEffect, useMemo, useState } from "react";
import { useAsync } from "react-async-hook";
import { useStrataSdks } from "./index";
import { useAccount } from "./useAccount";
import { useAssociatedAccount } from "./useAssociatedAccount";
import { useMint } from "./useMint";
import { useTwWrappedSolMint } from "./useTwWrappedSolMint";

export function supplyAsNum(mint: MintInfo): number {
  return amountAsNum(mint.supply, mint);
}

export function amountAsNum(amount: u64, mint: MintInfo): number {
  const decimals = new u64(Math.pow(10, mint.decimals).toString());
  const decimal = amount.mod(decimals).toNumber() / decimals.toNumber();
  return amount.div(decimals).toNumber() + decimal;
}

export function useSolOwnedAmount(ownerPublicKey?: PublicKey): {
  amount: number;
  loading: boolean;
} {
  const { publicKey } = useWallet();
  if (!ownerPublicKey) {
    ownerPublicKey = publicKey || undefined;
  }
  const { info: lamports, loading } = useAccount<number>(
    ownerPublicKey,
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
  const { amount: solOwnedAmount } = useSolOwnedAmount(wallet || undefined);
  const { associatedAccount, loading: loadingAssoc } = useAssociatedAccount(wallet, token);
  const wrappedSolMint = useTwWrappedSolMint();
  const mint = useMint(token);
  const [amount, setAmount] = useState<number>();

  useEffect(() => {
    if (
      token?.equals(NATIVE_MINT) ||
      (wrappedSolMint && token?.equals(wrappedSolMint))
    ) {
      setAmount(solOwnedAmount);
    } else if (mint && associatedAccount) {
      setAmount(amountAsNum(associatedAccount.amount, mint));
    } else if (mint && !associatedAccount && !loadingAssoc) {
      setAmount(0);
    }
  }, [loadingAssoc, associatedAccount, mint, solOwnedAmount, wrappedSolMint]);
  
  return typeof amount === "undefined" ? amount : Number(amount);
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
  const { info: tokenBondingAcct } = useTokenBonding(tokenBonding);
  const { info: reserves } = useTokenAccount(tokenBondingAcct?.baseStorage);
  const targetMint = useMint(tokenBondingAcct?.targetMint);
  const getPricing = async (
    tokenBondingSdk: SplTokenBonding | undefined,
    key: PublicKey | null | undefined,
    tokenBondingAcct: any, // Make the pricing be re-fetched whenever the bonding changes.
    reserves: any, // Make the pricing be re-fetched whenever the reserves change.
    mint: any // Make the pricing be re-fetched whenever the supply change. This doesn't account for
    // collective changes, but will due for now. TODO: Account for collective changes too
  ) => {
            console.log(
              "Reserves from bonding",
              tokenBondingAcct?.reserveBalanceFromBonding.toString()
            );
    return tokenBondingSdk && key && tokenBondingSdk.getPricing(key)
  }

  const {
    result: pricing,
    loading,
    error,
  } = useAsync(getPricing, [
    tokenBondingSdk,
    tokenBonding,
    tokenBondingAcct,
    reserves,
    targetMint,
  ]);

  return {
    pricing: pricing || undefined,
    tokenBonding: tokenBondingAcct,
    loading,
    error,
  };
}

const tokenBondingKey = async (
  mint: PublicKey | undefined | null,
  index: number
): Promise<PublicKey | null | undefined> =>
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
  const { result: key, loading } = useAsync(tokenBondingKey, [
    mint,
    index || 0,
  ]);
  const bondingPricing = useBondingPricing(key);

  return {
    ...bondingPricing,
    loading: bondingPricing.loading || loading,
  };
}
