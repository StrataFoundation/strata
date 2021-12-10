import { Avatar } from "@chakra-ui/avatar";
import { MenuItem, MenuList, Text, Center } from "@chakra-ui/react";
import { AccountLayout, u64 } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { BondingHierarchy, ISwapArgs, SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import React, { useEffect, useState } from "react";
import {
  amountAsNum, useBondingPricing, useErrorHandler, useEstimatedFees, useMint, useOwnedAmount,
  useSolOwnedAmount, useTokenBonding, useTokenMetadata
} from "../../hooks";
import { truthy } from "../../utils";
import { SolanaIcon } from "../icons";
import { Spinner } from "../Spinner";
import { ISwapFormProps, ISwapFormValues, SwapForm } from "./SwapForm";

interface ISwapProps
  extends Pick<
    ISwapFormProps,
    "onConnectWallet"
  > {
  tokenBondingKey: PublicKey;
  tradingMints: { base?: PublicKey; target?: PublicKey };
  onTradingMintsChange(mints: { base: PublicKey; target: PublicKey }): void;
  swap(args: ISwapArgs & { ticker: string }): void;
  loading: boolean
}

function getMints(hierarchy: BondingHierarchy | undefined): PublicKey[] {
  if (!hierarchy) {
    return [];
  }

  return [hierarchy.tokenBonding.baseMint, ...getMints(hierarchy.parent)]
}

function MintMenuItem({ mint, onClick }: { mint: PublicKey, onClick: () => void }) {
  const { image, metadata } = useTokenMetadata(mint);
  const isSol = mint.equals(SplTokenBonding.WRAPPED_SOL_MINT);
  
  return <MenuItem onClick={onClick}>
    <Center
      w={8}
      h={8}
      color="white"
      bg="indigo.500"
      rounded="full"
      mr="12px"
    >
      {isSol ?
        <SolanaIcon w={8} h={8} /> : <Avatar w={"100%"} h={"100%"} size="sm" src={image} />}
    </Center>
    { isSol ? <Text>SOL</Text> : <Text>{ metadata?.data.symbol }</Text> }
  </MenuItem>
}

export const PluggableSwap = ({
  onConnectWallet,
  tokenBondingKey,
  tradingMints,
  onTradingMintsChange,
  loading,
  swap
}: ISwapProps) => {
  const [internalError, setInternalError] = useState<Error | undefined>();
  const [spendCap, setSpendCap] = useState<number>(0);
  const { amount: feeAmount, error: feeError } = useEstimatedFees(
    AccountLayout.span,
    1
  );

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

  const { loading: curveLoading, pricing } = useBondingPricing(
    tokenBonding?.publicKey
  );
  const targetMintAcct = useMint(targetMint);
  const allMints = [tokenBonding?.targetMint, ...getMints(pricing?.hierarchy)].filter(truthy);

  const { amount: ownedSol, loading: solLoading } = useSolOwnedAmount();
  const ownedBaseNormal = useOwnedAmount(baseMint);
  const isBaseSol = baseMint?.equals(
    SplTokenBonding.WRAPPED_SOL_MINT
  );
  const isTargetSol = targetMint?.equals(
    SplTokenBonding.WRAPPED_SOL_MINT
  );
  const ownedBase = isBaseSol ? ownedSol : ownedBaseNormal;
  const { handleErrors } = useErrorHandler();
  handleErrors(
    baseMetaError,
    targetMetaError,
    feeError,
    internalError
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

  if (
    targetMetaLoading ||
    baseMetaLoading ||
    tokenBondingLoading ||
    curveLoading ||
    solLoading ||
    !tokenBonding ||
    !pricing ||
    !baseMeta ||
    !baseMint ||
    !targetMint
  ) {
    return <Spinner />;
  }

  const baseInfo = {
    name: baseMeta?.data.name || "",
    ticker: baseMeta?.data.symbol || "",
    icon: <Avatar w="100%" h="100%" size="sm" src={baseImage} />,
    publicKey: baseMint,
  };
  const targetInfo = {
    name: targetMeta?.data.name || "",
    ticker: targetMeta?.data.symbol || "",
    icon: <Avatar w="100%" h="100%" size="sm" src={targetImage} />,
    publicKey: targetMint,
  };
  const solInfo = {
    name: "SOL",
    ticker: "SOL",
    icon: <SolanaIcon w="full" h="full" />,
    publicKey: SplTokenBonding.WRAPPED_SOL_MINT,
  }
  const base = isBaseSol ? solInfo : baseInfo;
  const target = isTargetSol ? solInfo : targetInfo;

  const handleSubmit = async (values: ISwapFormValues) => {
    if (values.topAmount) {
      try {
        console.log(`Swapping ${baseMint.toBase58()} to ${targetMint.toBase58()}`)
        await swap({
          baseAmount: +values.topAmount,
          baseMint,
          targetMint,
          slippage: +values.slippage / 100,
          ticker: target.ticker
        })
      } catch (e: any) {
        setInternalError(e);
      }
    }
  };

  return (
    <SwapForm
      isSubmitting={loading}
      onConnectWallet={onConnectWallet}
      onFlipTokens={() => {
        onTradingMintsChange({
          base: targetMint,
          target: baseMint
        });
      }}
      onBuyBase={() => {
        const tokenBonding = pricing.hierarchy.findTarget(baseMint);
        onTradingMintsChange({
          base: tokenBonding.baseMint,
          target: tokenBonding.targetMint
        });
      }}
      onSubmit={handleSubmit}
      tokenBonding={tokenBonding}
      pricing={pricing}
      base={base}
      target={target}
      ownedBase={ownedBase || 0}
      spendCap={spendCap}
      feeAmount={feeAmount}
      baseOptions={
        <MenuList borderColor="gray.300" zIndex={1000}>
          { allMints.filter(mint => baseMint && !mint.equals(baseMint)).map(mint =>
            <MintMenuItem 
              mint={mint} 
              onClick={() => {
                onTradingMintsChange({
                  base: mint,
                  target: targetMint && mint.equals(targetMint) ? baseMint: targetMint
                });
              }}
            />
          )}
        </MenuList>
      }
      targetOptions={
        <MenuList borderColor="gray.300" zIndex={1000}>
          { allMints.filter(mint => targetMint && !mint.equals(targetMint)).map(mint =>
            <MintMenuItem 
              mint={mint} 
              onClick={() => {
                onTradingMintsChange({
                  target: mint,
                  base: baseMint && mint.equals(baseMint) ? targetMint : baseMint
                });
              }} 
            />
          )}
        </MenuList>
      }
    />
  );
};
