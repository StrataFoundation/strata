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
  useFungibleChildEntangler,
  useFungibleParentEntangler,
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
  childEntanglerKey,
  showAttribution = true,
  onConnectWallet = () => {}
}: {
  mintKey: PublicKey | undefined;
  childEntanglerKey?: PublicKey | undefined;
  showAttribution?: boolean;
  onConnectWallet?: () => void;
}) => {
  const { tokenBondingSdk, fungibleEntanglerSdk } = useStrataSdks();

  // load the initial curve
  const { result: tokenBondingKey, error: keyError1 } = useTokenBondingKey(
    mintKey,
    0
  );
  const { info: tokenBonding } = useTokenBonding(tokenBondingKey);
  
  // load the fungible entangler. may or may not be undefined
  const { info: childEntangler } = useFungibleChildEntangler(childEntanglerKey);
  const { info: parentEntangler } = useFungibleParentEntangler(childEntangler?.parentEntangler);

  // load to find the amount remaining in the fungible entangler
  const { info: supplyAcc } = useTokenAccount(
    parentEntangler?.parentStorage
  );
  const supplyMint = useMint(parentEntangler?.parentMint);

  const {
    execute: onSubmit,
    loading: submitting,
    error: submitError,
  } = useAsyncCallback(async function (values: ISwapFormValues) {
    const instructions = [];
    const signers = [];

    // buy the first bonding curve
    const { instructions: i1, signers: s1 } =
      await tokenBondingSdk!.buyInstructions({
        desiredTargetAmount: +values.bottomAmount,
        slippage: +values.slippage / 100,
        tokenBonding: tokenBondingKey!,
      });
    instructions.push(...i1);
    signers.push(...s1);

    // if there is an entangler, then swap the token from the bonding curve through it
    if (childEntangler && parentEntangler) {
      const { instructions: i2, signers: s2 } = 
        await fungibleEntanglerSdk!.swapChildInstructions({
          parentEntangler: parentEntangler.publicKey,
          childEntangler: childEntangler.publicKey,
          amount: +values.bottomAmount,
      })
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
  handleErrors(keyError1, submitError);

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
    tokenBondingKey: tokenBondingKey,
  });

  return (
    <SwapForm
      showAttribution={showAttribution}
      isLoading={driverLoading}
      isSubmitting={submitting}
      {...swapProps}
      onSubmit={onSubmit}
      numRemaining={
        supplyAcc && supplyMint && toNumber(supplyAcc.amount, supplyMint)
      }
    />
  );
};
