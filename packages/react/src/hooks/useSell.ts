import { useAsyncCallback } from "react-async-hook";
import { PublicKey } from "@solana/web3.js";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import BN from "bn.js";
import { useStrataSdks } from "./";

export const useSell = (): [
  (tokenBonding: PublicKey, amount: number, slippage: number) => Promise<void>,
  { data: any; loading: boolean; error: Error | undefined }
] => {
  const { connected, publicKey } = useWallet();
  const { tokenBondingSdk, loading: sdkLoading } = useStrataSdks();

  const {
    result: data,
    execute: sell,
    error,
    loading,
  } = useAsyncCallback(async (tokenBonding, amount, slippage) => {
    if (!connected || !publicKey) throw new WalletNotConnectedError();

    await tokenBondingSdk!.sell({
      tokenBonding,
      targetAmount: new BN(Math.floor(amount * Math.pow(10, 9))),
      slippage,
    });
  });

  return [sell, { data, loading: sdkLoading || loading, error }];
};
