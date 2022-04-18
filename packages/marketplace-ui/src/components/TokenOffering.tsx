import { PublicKey } from "@solana/web3.js";
import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  SwapForm,
  Notification,
  useErrorHandler,
  useTokenBonding,
  useSwapDriver,
  ISwapFormValues,
  useStrataSdks,
  useTokenAccount,
  useMint,
  useTokenBondingKey,
  roundToDecimals,
} from "@strata-foundation/react";
import { useAsync, useAsyncCallback, UseAsyncReturn } from "react-async-hook";
import {
  SplTokenBonding,
  toNumber,
} from "@strata-foundation/spl-token-bonding";

const identity = () => {};
export const TokenOffering = ({
  mintKey,
  showAttribution = true
}: {
  mintKey: PublicKey | undefined;
  showAttribution?: boolean;
}) => {
  const { result: sellOnlyTokenBondingKey, error: keyError1 } =
    useTokenBondingKey(mintKey, 1);
  const { tokenBondingSdk } = useStrataSdks();
  const { info: sellOnlyTokenBonding, loading: sellOnlyLoading } =
    useTokenBonding(sellOnlyTokenBondingKey);
  const { result: tokenBondingKey, error: keyError2 } = useTokenBondingKey(
    sellOnlyTokenBonding?.targetMint,
    0
  );

  const { info: tokenBonding } = useTokenBonding(tokenBondingKey);
  const { info: supplyAcc } = useTokenAccount(
    sellOnlyTokenBonding?.baseStorage
  );
  const supplyMint = useMint(sellOnlyTokenBonding?.baseMint);

  const {
    execute: onSubmit,
    loading: submitting,
    error: submitError,
  } = useAsyncCallback(async function (values: ISwapFormValues) {
    const instructions = [];
    const signers = [];
    const { instructions: i1, signers: s1 } =
      await tokenBondingSdk!.buyInstructions({
        desiredTargetAmount: +values.bottomAmount,
        slippage: +values.slippage / 100,
        tokenBonding: tokenBondingKey!,
      });
    instructions.push(...i1);
    signers.push(...s1);
    if (sellOnlyTokenBonding) {
      const { instructions: i2, signers: s2 } =
        await tokenBondingSdk!.sellInstructions({
          targetAmount: roundToDecimals(
            +values.bottomAmount,
            supplyMint.decimals
          ),
          slippage: +values.slippage / 100,
          tokenBonding: sellOnlyTokenBondingKey!,
        });

      instructions.push(...i2);
      signers.push(...s2);
    }

    await tokenBondingSdk!.sendInstructions(instructions, signers);
    toast.custom((t) => (
      <Notification
        show={t.visible}
        type="success"
        heading="Transaction Successful"
        message={`Succesfully purchased ${Number(values.bottomAmount).toFixed(
          9
        )}!`}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ));
  });

  const { handleErrors } = useErrorHandler();
  handleErrors(keyError1, keyError2, submitError);

  const tradingMints = useMemo(() => {
    return {
      base: tokenBonding?.baseMint,
      target: tokenBonding?.targetMint,
    };
  }, [tokenBonding?.baseMint, tokenBonding?.targetMint]);
  const { loading: driverLoading, ...swapProps } = useSwapDriver({
    tradingMints,
    onTradingMintsChange: () => {},
    swap: (args) => {},
    onConnectWallet: identity,
    tokenBondingKey: tokenBondingKey,
  });

  return (
    <SwapForm
      showAttribution={showAttribution}
      isLoading={driverLoading || sellOnlyLoading}
      isSubmitting={submitting}
      {...swapProps}
      onSubmit={onSubmit}
      numRemaining={
        supplyAcc && supplyMint && toNumber(supplyAcc.amount, supplyMint)
      }
    />
  );
};
