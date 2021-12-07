import React, { useState, useEffect } from "react";
import { u64, AccountLayout } from "@solana/spl-token";
import {
  useBuy,
  useSell,
  useMint,
  useBondingPricing,
  useOwnedAmount,
  useSolOwnedAmount,
  amountAsNum,
  useEstimatedFees,
  useTokenMetadata,
  useErrorHandler,
  useTokenBonding,
} from "../../hooks";
import { Spinner } from "../Spinner";
import { SolanaIcon } from "../icons";

import { ISwapFormValues, ISwapFormProps, SwapForm } from "./SwapForm";
import { PublicKey } from "@solana/web3.js";
import { Avatar } from "@chakra-ui/avatar";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";

interface ISwapProps
  extends Pick<
    ISwapFormProps,
    "onConnectWallet" | "onFlipTokens" | "onBuyBase"
  > {
  tokenBondingKey: PublicKey;
  action: "buy" | "sell";
  onSuccess(args: { ticker: string; mint: PublicKey; amount: number }): void;
}

export const PluggableSwap = ({
  onConnectWallet,
  onFlipTokens,
  onBuyBase,
  onSuccess,
  tokenBondingKey,
  action,
}: ISwapProps) => {
  const [buy, { loading: buyLoading, error: buyError }] = useBuy();
  const [sell, { loading: sellLoading, error: sellError }] = useSell();
  const [internalError, setInternalError] = useState<Error | undefined>();
  const [spendCap, setSpendCap] = useState<number>(0);
  const { amount: feeAmount, error: feeError } = useEstimatedFees(
    AccountLayout.span,
    1
  );
  const isBuying = action === "buy";

  const { info: tokenBonding, loading: tokenBondingLoading } =
    useTokenBonding(tokenBondingKey);

  const {
    image: baseImage,
    metadata: baseMeta,
    loading: baseMetaLoading,
    error: baseMetaError,
  } = useTokenMetadata(tokenBonding?.baseMint);
  const {
    image: targetImage,
    metadata: targetMeta,
    loading: targetMetaLoading,
    error: targetMetaError,
  } = useTokenMetadata(tokenBonding?.targetMint);

  const { loading: curveLoading, pricing } = useBondingPricing(
    tokenBonding?.publicKey
  );
  const targetMint = useMint(tokenBonding?.targetMint);

  const { amount: ownedSol, loading: solLoading } = useSolOwnedAmount();
  const ownedBaseNormal = useOwnedAmount(tokenBonding?.baseMint);
  const isBaseSol = tokenBonding?.baseMint.equals(
    SplTokenBonding.WRAPPED_SOL_MINT
  );
  const ownedBase = isBaseSol ? ownedSol : ownedBaseNormal;
  const ownedTarget = useOwnedAmount(tokenBonding?.targetMint);
  const { handleErrors } = useErrorHandler();
  handleErrors(
    baseMetaError,
    targetMetaError,
    buyError,
    feeError,
    sellError,
    internalError
  );

  useEffect(() => {
    if (tokenBonding && targetMint && pricing) {
      const purchaseCap = tokenBonding.purchaseCap
        ? amountAsNum(tokenBonding.purchaseCap as u64, targetMint)
        : Number.POSITIVE_INFINITY;

      const maxSpend = pricing.buyTargetAmount(purchaseCap);

      setSpendCap(maxSpend);
    }
  }, [tokenBonding, targetMint, pricing, setSpendCap]);

  if (
    targetMetaLoading ||
    baseMetaLoading ||
    tokenBondingLoading ||
    curveLoading ||
    solLoading ||
    !tokenBonding ||
    !pricing ||
    !baseMeta
  ) {
    return <Spinner />;
  }

  const baseInfo = {
    name: baseMeta?.data.name || "",
    ticker: baseMeta?.data.symbol || "",
    icon: <Avatar size="sm" src={baseImage} />,
    publicKey: tokenBonding.baseMint,
  };
  const base = isBaseSol
    ? {
        name: "SOL",
        ticker: "SOL",
        icon: <SolanaIcon w="full" h="full" />,
        publicKey: SplTokenBonding.WRAPPED_SOL_MINT,
      }
    : baseInfo;

  const target = {
    name: targetMeta?.data.name || "",
    ticker: targetMeta?.data.symbol || "",
    icon: <Avatar size="sm" src={targetImage} />,
    publicKey: tokenBonding.targetMint,
  };

  const handleSubmit = async (values: ISwapFormValues) => {
    const { publicKey } = isBuying ? target : base;

    if (values.topAmount) {
      try {
        if (isBuying) {
          await buy(
            tokenBonding.publicKey,
            +values.topAmount,
            +values.slippage / 100
          );
        } else {
          await sell(
            tokenBonding.publicKey,
            +values.topAmount,
            +values.slippage / 100
          );
        }

        onSuccess({
          mint: publicKey,
          amount: values.bottomAmount,
          ticker: isBuying ? target.ticker : base.ticker,
        });
      } catch (e: any) {
        setInternalError(e);
      }
    }
  };

  return (
    <SwapForm
      action={action}
      isSubmitting={buyLoading || sellLoading}
      onConnectWallet={onConnectWallet}
      onFlipTokens={onFlipTokens}
      onBuyBase={onBuyBase}
      onSubmit={handleSubmit}
      tokenBonding={tokenBonding}
      pricing={pricing}
      base={isBuying ? base : target}
      target={isBuying ? target : base}
      ownedBase={isBuying ? ownedBase || 0 : ownedTarget || 0}
      spendCap={spendCap}
      feeAmount={feeAmount}
    />
  );
};
