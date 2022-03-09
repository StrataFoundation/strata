import { PublicKey } from "@solana/web3.js";
import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  SwapForm,
  Notification,
  useErrorHandler,
  useTokenBonding,
  useSwapDriver,
  ISwapFormValues,
  useStrataSdks
} from "@strata-foundation/react";
import { useAsync, useAsyncCallback, UseAsyncReturn } from "react-async-hook";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";

async function tokenBondingKey(mintKey: PublicKey | undefined, index: number) {
  return mintKey
    ? (await SplTokenBonding.tokenBondingKey(mintKey, index))[0]
    : undefined
}

function useTokenBondingKey(
  mintKey: PublicKey | undefined,
  index: number
): UseAsyncReturn<PublicKey | undefined> {
  return useAsync(tokenBondingKey, [mintKey, index]);
}

const identity = () => {};
export const TokenOffering = ({ mintKey, index = 1 }: { mintKey: PublicKey | undefined, index?: number }) => {
  const { result: sellOnlyTokenBondingKey, error: keyError1 } = useTokenBondingKey(mintKey, index);
  const { tokenBondingSdk } = useStrataSdks();
  const { info: sellOnlyTokenBonding } = useTokenBonding(
    sellOnlyTokenBondingKey
  );
  const { result: tokenBondingKey, error: keyError2 } = useTokenBondingKey(
    sellOnlyTokenBonding?.targetMint,
    0
  );
  const { info: tokenBonding } = useTokenBonding(tokenBondingKey);

  const { execute: onSubmit, loading: submitting, error: submitError } = useAsyncCallback(async function(values: ISwapFormValues) {
    const { instructions: i1, signers: s1 } = await tokenBondingSdk!.buyInstructions({
      desiredTargetAmount: +values.bottomAmount,
      slippage: +values.slippage / 100,
      tokenBonding: tokenBondingKey!
    });
    const { instructions: i2, signers: s2 } = await tokenBondingSdk!.sellInstructions({
      targetAmount: +values.bottomAmount,
      slippage: +values.slippage / 100,
      tokenBonding: sellOnlyTokenBondingKey!,
    });
    await tokenBondingSdk!.sendInstructions([...i1, ...i2], [...s1, ...s2]);
    toast.custom((t) => (
      <Notification
        show={t.visible}
        type="success"
        heading="Transaction Successful"
        message={`Succesfully purchased ${Number(values.bottomAmount).toFixed(9)}!`}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ));
  });
  
  const { handleErrors } = useErrorHandler();
  handleErrors(keyError1, keyError2, submitError);

  const { loading: driverLoading, ...swapProps } = useSwapDriver({
    tradingMints: {
      base: tokenBonding?.baseMint,
      target: tokenBonding?.targetMint,
    },
    onTradingMintsChange: () => {},
    swap: (args) =>
      {},
    onConnectWallet: identity,
    tokenBondingKey: tokenBondingKey,
  });

  return (
    <SwapForm
      isLoading={driverLoading}
      isSubmitting={submitting}
      {...swapProps}
      onSubmit={onSubmit}
    />
  );
};
