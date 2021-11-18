import { useAsyncCallback } from "react-async-hook";
import { PublicKey } from "@solana/web3.js";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import BN from "bn.js";
import { useStrataSdks } from "./";

export const useBuy = (): [
  (
    tokenBonding: PublicKey,
    baseAmount: number,
    slippage: number
  ) => Promise<void>,
  { data: any; loading: boolean; error: Error | undefined }
] => {
  const { connected, publicKey } = useWallet();
  const { tokenBondingSdk, loading: sdkLoading } = useStrataSdks();

  const {
    result: data,
    execute: buy,
    error,
    loading,
  } = useAsyncCallback(async (tokenBonding, amount, slippage) => {
    if (!connected || !publicKey) throw new WalletNotConnectedError();

    await tokenBondingSdk!.buy({
      tokenBonding,
      baseAmount: amount,
      slippage,
    });
  });

  return [buy, { data, loading: sdkLoading || loading, error }];
};
