import { BN, Provider } from "@project-serum/anchor";
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useCapInfo } from "./useCapInfo";
import {
  BondingHierarchy,
  ISwapArgs,
  toNumber,
} from "@strata-foundation/spl-token-bonding";
import React, { useEffect, useState } from "react";
import { useAsync } from "react-async-hook";
import { ISwapFormProps, ISwapFormValues } from "../components/Swap/SwapForm";
import { truthy } from "../utils";
import {
  amountAsNum,
  useBondingPricing,
  useErrorHandler,
  useEstimatedFees,
  useMint,
  useOwnedAmount,
  useProvider,
  useTokenBonding,
  useTokenMetadata,
} from "./";

export interface ISwapDriverArgs
  extends Pick<ISwapFormProps, "onConnectWallet" | "extraTransactionInfo"> {
  tokenBondingKey: PublicKey | undefined;
  tradingMints: { base?: PublicKey; target?: PublicKey };
  onTradingMintsChange(mints: { base: PublicKey; target: PublicKey }): void;
  swap(args: ISwapArgs & { ticker: string }): void;
}

function getMints(hierarchy: BondingHierarchy | undefined): PublicKey[] {
  if (!hierarchy) {
    return [];
  }

  return [hierarchy.tokenBonding.baseMint, ...getMints(hierarchy.parent)];
}

export async function getMissingSpace(
  provider: Provider | undefined,
  hierarchy: BondingHierarchy | undefined,
  baseMint: PublicKey | undefined,
  targetMint: PublicKey | undefined
): Promise<number> {
  if (!provider || !provider.wallet || !provider.wallet.publicKey || !baseMint || !targetMint || !hierarchy) {
    return 0;
  }

  const path = hierarchy.path(baseMint, targetMint);
  const accounts = (
    await Promise.all(
      path.map(async (hierarchy) => {
        return [
          await Token.getAssociatedTokenAddress(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            hierarchy.tokenBonding.baseMint,
            provider.wallet.publicKey,
            true
          ),
          await Token.getAssociatedTokenAddress(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            hierarchy.tokenBonding.targetMint,
            provider.wallet.publicKey,
            true
          ),
        ];
      })
    )
  ).flat();
  const distinctAccounts = Array.from(new Set(accounts.map((a) => a.toBase58())));
  const totalSpace = (
    await Promise.all(
      distinctAccounts.map(async (acct) => {
        if (await provider.connection.getAccountInfo(new PublicKey(acct))) {
          return 0;
        }

        return AccountLayout.span as number;
      })
    )
  ).reduce((acc, total) => acc + total, 0);
  return totalSpace;
}

export const useSwapDriver = ({
  onConnectWallet,
  tokenBondingKey,
  tradingMints,
  onTradingMintsChange,
  swap,
  extraTransactionInfo,
}: ISwapDriverArgs): Omit<ISwapFormProps, "isSubmitting"> & {
  loading: boolean;
} => {
  const { provider } = useProvider();
  const [internalError, setInternalError] = useState<Error | undefined>();
  const [spendCap, setSpendCap] = useState<number>(0);
  const { info: tokenBonding, loading: tokenBondingLoading } =
    useTokenBonding(tokenBondingKey);
  const { base: baseMint, target: targetMint } = tradingMints;

  const {
    image: baseImage,
    metadata: baseMeta,
    loading: baseMetaLoading,
    error: baseMetaError,
  } = useTokenMetadata(baseMint);

  const {
    image: targetImage,
    metadata: targetMeta,
    loading: targetMetaLoading,
    error: targetMetaError,
  } = useTokenMetadata(targetMint);
  const {
    loading: curveLoading,
    pricing,
    error,
  } = useBondingPricing(tokenBonding?.publicKey);

  const { result: missingSpace, error: missingSpaceError } = useAsync(
    getMissingSpace,
    [provider, pricing?.hierarchy, baseMint, targetMint]
  );

  const { amount: feeAmount, error: feeError } = useEstimatedFees(
    missingSpace || 0,
    1
  );

  const targetMintAcct = useMint(targetMint);

  const allMints = React.useMemo(
    () =>
      [tokenBonding?.targetMint, ...getMints(pricing?.hierarchy)].filter(
        truthy
      ),
    [tokenBonding, pricing]
  );

  const ownedBase = useOwnedAmount(baseMint);
  const { handleErrors } = useErrorHandler();
  handleErrors(
    missingSpaceError,
    baseMetaError,
    targetMetaError,
    feeError,
    internalError,
    error
  );

  useEffect(() => {
    if (tokenBonding && targetMintAcct && pricing) {
      const purchaseCap = tokenBonding.purchaseCap
        ? amountAsNum(tokenBonding.purchaseCap as u64, targetMintAcct)
        : Number.POSITIVE_INFINITY;

      const maxSpend = pricing.buyTargetAmount(purchaseCap);

      setSpendCap(maxSpend);
    }
  }, [tokenBonding, targetMint, pricing, setSpendCap]);

  const base = baseMint && {
    name: baseMeta?.data.name || "",
    ticker: baseMeta?.data.symbol || "",
    image: baseImage,
    publicKey: baseMint,
  };

  const target = targetMint && {
    name: targetMeta?.data.name || "",
    ticker: targetMeta?.data.symbol || "",
    image: targetImage,
    publicKey: targetMint,
  };

  const lowMint =
    base &&
    target &&
    pricing?.hierarchy.lowest(base.publicKey, target.publicKey);
  const targetBonding = lowMint && pricing?.hierarchy.findTarget(lowMint);
  const mintCap: number | undefined =
    targetBonding &&
    targetMintAcct &&
    (targetBonding.mintCap as BN | undefined) &&
    toNumber(targetBonding.mintCap as BN, targetMintAcct);

  const { numRemaining } = useCapInfo(tokenBondingKey);

  const handleSubmit = async (values: ISwapFormValues) => {
    if (values.topAmount) {
      try {
        // They explicitly set the amount they want. Accomodate this if we're not doing a multi
        // level swap
        const path = pricing?.hierarchy.path(baseMint!, targetMint!);
        let shouldUseDesiredTargetAmount =
          values.lastSet == "bottom" &&
          path &&
          path.length == 1 &&
          path[0].tokenBonding.targetMint.equals(targetMint!);

        let outputAmountSetting: any = {
          baseAmount: +values.topAmount,
          expectedOutputAmount: +values.bottomAmount,
        };
        if (shouldUseDesiredTargetAmount) {
          outputAmountSetting = {
            desiredTargetAmount: +values.bottomAmount,
            expectedBaseAmount: +values.topAmount,
          };
        }

        await swap({
          baseMint: baseMint!,
          targetMint: targetMint!,
          ...outputAmountSetting,
          slippage: +values.slippage / 100,
          ticker: target!.ticker,
        });
      } catch (e: any) {
        setInternalError(e);
      }
    }
  };

  return {
    extraTransactionInfo,
    numRemaining,
    mintCap,
    loading:
      targetMetaLoading ||
      baseMetaLoading ||
      tokenBondingLoading ||
      !tokenBonding ||
      !baseMeta,
    onConnectWallet,
    onTradingMintsChange,
    onBuyBase: () => {
      const tokenBonding = pricing!.hierarchy.findTarget(baseMint!);
      onTradingMintsChange({
        base: tokenBonding.baseMint,
        target: tokenBonding.targetMint,
      });
    },
    onSubmit: handleSubmit,
    tokenBonding,
    pricing,
    base,
    target,
    ownedBase,
    spendCap,
    feeAmount,
    baseOptions: React.useMemo(
      () =>
        allMints.filter(
          (mint) =>
            baseMint &&
            !mint.equals(baseMint) &&
            pricing &&
            targetMint &&
            pricing.hierarchy.path(mint, targetMint).length > 0
        ),
      [baseMint, allMints]
    ),
    targetOptions: React.useMemo(
      () =>
        allMints.filter(
          (mint) =>
            targetMint &&
            pricing &&
            baseMint &&
            !mint.equals(targetMint) &&
            pricing.hierarchy.path(baseMint, mint).length > 0
        ),
      [targetMint, allMints]
    ),
    swapBaseWithTargetEnabled: Boolean(
      baseMint &&
        targetMint &&
        pricing &&
        pricing.hierarchy.path(targetMint, baseMint).length > 0
    ),
  };
};
