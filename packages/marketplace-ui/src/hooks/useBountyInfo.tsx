import { PublicKey } from "@solana/web3.js";
import { MarketplaceSdk } from "@strata-foundation/marketplace-sdk";
import {
  useMint, useReserveAmount, useTokenBondingFromMint,
  useTokenMetadata
} from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import { SplTokenMetadata } from "@strata-foundation/spl-utils";
import useDebouncedMemo from "@sevenoutman/use-debounced-memo";
import React, { useMemo } from "react";

export function useBountyInfo(mintKey: PublicKey | undefined): {
  info: {
    name: string | undefined;
    image: string |undefined;
    createdAt: Date | undefined;
    description: string | undefined;
    fundsHaveBeenUsed: boolean | undefined;
    bountyClosed: boolean | undefined;
    contributed: number | undefined;
    attributes: Record<string, string | number> | undefined;
    isNormalBounty: boolean;
  };
  loading: boolean;
} {
  const { info: tokenBonding, loading: bondingLoading } =
    useTokenBondingFromMint(mintKey);
  const {
    data: targetData,
    metadata,
    loading: targetMetaLoading,
    image,
    displayName
  } = useTokenMetadata(mintKey);
  const reserveAmount = useReserveAmount(tokenBonding?.publicKey);
  const baseMint = useMint(tokenBonding?.baseMint);
  // Debounce because this can cause it to flash a notification when reserves change at the
  // same time as bonding, but one comes through before the other.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fundsHaveBeenUsed = useDebouncedMemo(
      () =>
        tokenBonding &&
        baseMint &&
        reserveAmount &&
        toNumber(tokenBonding.reserveBalanceFromBonding, baseMint) !==
          reserveAmount,
    [tokenBonding, baseMint, reserveAmount],
    500
  );

  const bountyClosed = useDebouncedMemo(
    () => Boolean(mintKey && !tokenBonding && !bondingLoading && metadata),
    [mintKey,tokenBonding, bondingLoading, metadata],
    500
  );

  const attributes = React.useMemo(
    () => SplTokenMetadata.attributesToRecord(targetData?.attributes),
    [targetData]
  );

  return {
    info: {
      name: displayName,
      image,
      createdAt:
        tokenBonding && new Date(tokenBonding.goLiveUnixTime.toNumber() * 1000),
      description: targetData?.description,
      fundsHaveBeenUsed,
      bountyClosed,
      contributed: reserveAmount,
      attributes,
      isNormalBounty: MarketplaceSdk.isNormalBounty(tokenBonding),
    },
    loading: bondingLoading || targetMetaLoading,
  };
}
