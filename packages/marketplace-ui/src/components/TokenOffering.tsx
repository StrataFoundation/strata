import { PublicKey, Signer, TransactionInstruction } from "@solana/web3.js";
import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  SwapForm,
  Notification,
  useErrorHandler,
  useSwapDriver,
  ISwapFormValues,
  useStrataSdks,
  useMint,
  useTokenSwapFromId,
  roundToDecimals,
} from "@strata-foundation/react";
import { useAsyncCallback } from "react-async-hook";

const identity = () => {};
export const TokenOffering = ({
  id,
  showAttribution = true,
  onConnectWallet = () => {},
  onSuccess = (values) => {
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
  },
}: {
  id: PublicKey | undefined;
  showAttribution?: boolean;
  onConnectWallet?: () => void;
  onSuccess?: (values: ISwapFormValues) => void;
}) => {
  const { tokenBondingSdk, fungibleEntanglerSdk } = useStrataSdks();

  const {
    tokenBonding,
    retrievalTokenBonding,
    numRemaining,
    childEntangler,
    parentEntangler,
  } = useTokenSwapFromId(id);
  const supplyMint = useMint(retrievalTokenBonding?.baseMint);
  const {
    execute: onSubmit,
    loading: submitting,
    error: submitError,
  } = useAsyncCallback(async function (values: ISwapFormValues) {
    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];

    // buy the first bonding curve
    const { instructions: i1, signers: s1 } =
      await tokenBondingSdk!.buyInstructions({
        desiredTargetAmount: +values.bottomAmount,
        slippage: +values.slippage / 100,
        tokenBonding: tokenBonding?.publicKey!,
      });
    instructions.push(...i1);
    signers.push(...s1);

    // if there is an entangler, then swap the token from the bonding curve through it
    if (childEntangler && parentEntangler) {
      const { instructions: i2, signers: s2 } =
        await fungibleEntanglerSdk!.swapChildForParentInstructions({
          parentEntangler: parentEntangler.publicKey,
          childEntangler: childEntangler.publicKey,
          amount: +values.bottomAmount,
        });
      instructions.push(...i2);
      signers.push(...s2);
    } else if (retrievalTokenBonding) {
      const { instructions: i2, signers: s2 } =
        await tokenBondingSdk!.sellInstructions({
          targetAmount: roundToDecimals(
            +values.bottomAmount,
            supplyMint.decimals
          ),
          slippage: +values.slippage / 100,
          tokenBonding: retrievalTokenBonding.publicKey!,
        });

      instructions.push(...i2);
      signers.push(...s2);
    }
    await tokenBondingSdk!.sendInstructions(instructions, signers);
    onSuccess(values)
  });

  const { handleErrors } = useErrorHandler();
  handleErrors(submitError);

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
    onConnectWallet: onConnectWallet,
    id,
  });

  return (
    <SwapForm
      showAttribution={showAttribution}
      isLoading={driverLoading}
      isSubmitting={submitting}
      {...swapProps}
      onSubmit={onSubmit}
      numRemaining={numRemaining}
    />
  );
};
