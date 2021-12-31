import { Provider } from "@project-serum/common";
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
  BondingHierarchy,
  ISwapArgs,
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
  useSolOwnedAmount,
  useTokenBonding,
  useTokenMetadata,
} from "./";
import { useTwWrappedSolMint } from "./useTwWrappedSolMint";

export interface ISwapDriverArgs
  extends Pick<ISwapFormProps, "onConnectWallet" | "extraTransactionInfo"> {
  tokenBondingKey: PublicKey;
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

async function getMissingSpace(
  provider: Provider | undefined,
  hierarchy: BondingHierarchy | undefined,
  baseMint: PublicKey | undefined,
  targetMint: PublicKey | undefined
): Promise<number> {
  if (!provider || !provider.wallet || !baseMint || !targetMint || !hierarchy) {
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
            provider.wallet.publicKey
          ),
          await Token.getAssociatedTokenAddress(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            hierarchy.tokenBonding.targetMint,
            provider.wallet.publicKey
          ),
        ];
      })
    )
  ).flat();
  const distinctAccounts = [...new Set(accounts.map((a) => a.toBase58()))];
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

export const useSwapDriver = (
  args: ISwapDriverArgs
): Omit<ISwapFormProps, "isSubmitting"> & { loading: boolean } => {
  const {
    onConnectWallet,
    tokenBondingKey,
    tradingMints,
    onTradingMintsChange,
    swap,
    extraTransactionInfo,
  } = args;
  const [internalError, setInternalError] = useState<Error | undefined>();
  const [spendCap, setSpendCap] = useState<number>(0);
  const { provider } = useProvider();
  const wrappedSol = useTwWrappedSolMint();

  if (wrappedSol && args.tradingMints.base?.equals(wrappedSol)) {
    args.tradingMints.base = NATIVE_MINT;
  }

  if (wrappedSol && args.tradingMints.target?.equals(wrappedSol)) {
    args.tradingMints.target = NATIVE_MINT;
  }

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

  const { loading: curveLoading, pricing, error } = useBondingPricing(
    tokenBonding?.publicKey
  );
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

  const handleSubmit = async (values: ISwapFormValues) => {
    if (values.topAmount) {
      try {
        await swap({
          baseAmount: +values.topAmount,
          baseMint: baseMint!,
          targetMint: targetMint!,
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
    loading:
      targetMetaLoading ||
      baseMetaLoading ||
      tokenBondingLoading ||
      curveLoading ||
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
      () => allMints.filter((mint) => baseMint && !mint.equals(baseMint)),
      [baseMint, allMints]
    ),
    targetOptions: React.useMemo(
      () => allMints.filter((mint) => targetMint && !mint.equals(targetMint)),
      [targetMint, allMints]
    ),
  };
};
