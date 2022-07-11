import {
  useCurve,
  useMint,
  useQueryString,
  useSolanaUnixTime,
  useTokenBonding,
  useTokenSwapFromId,
} from "@strata-foundation/react";
import { useVariables } from "../../theme/Root/variables";
import React, { useState } from "react";
import {
  CurveConfiguratorFromVariables,
  CurveConfiguratorFromVariablesProps,
  EstimatedSalesVsTime,
  PriceVsSupplyDisplay,
  PriceVsTimeDisplay,
  RateVsTimeDisplay,
} from "../CurveConfigurator";
import { toNumber } from "@strata-foundation/spl-utils";
import { useMemo } from "react";
import { Box, SimpleGrid, VStack, Input } from "@chakra-ui/react";

export function CurveConfiguratorFromBonding({
  priceVsSupply = true,
  priceVsTime = true,
  rateVsTime = false,
  salesVsTime = false,
}: CurveConfiguratorFromVariablesProps) {
  const { tokenBondingKey: inputTokenBondingKey, id } = useVariables();
  const { tokenBonding } = useTokenSwapFromId(id);
  const tokenBondingKey = useMemo(() => inputTokenBondingKey || tokenBonding?.publicKey, [tokenBonding, inputTokenBondingKey])
  const { info: tokenBondingAcct } = useTokenBonding(tokenBondingKey);
  const { info: curve } = useCurve(tokenBondingAcct?.curve);
  const baseMint = useMint(tokenBondingAcct?.baseMint);
  const targetMint = useMint(tokenBondingAcct?.targetMint);
  const [timeOffset, setTimeOffset] = useState<string>();
  const [reserves, setReserves] = useState<string>();
  const [supply, setSupply] = useState<string>();
  const [startSupply, setStartSupply] = useState<string>();
  const [endSupply, setEndSupply] = useState<string>();
  const [maxTime, setMaxTime] = useState<string>();
  const unixTime = useSolanaUnixTime();

  const bondTimeOffset = useMemo(() => {
    return (
      tokenBondingAcct &&
      unixTime &&
      Math.max(unixTime - tokenBondingAcct.goLiveUnixTime.toNumber(), 0)
    );
  }, [unixTime, tokenBondingAcct]);
  const bondReserves = useMemo(() => {
    return (
      tokenBondingAcct &&
      baseMint &&
      toNumber(tokenBondingAcct.reserveBalanceFromBonding, baseMint).toString()
    );
  }, [tokenBondingAcct, baseMint]);
  const bondSupply = useMemo(() => {
    return (
      tokenBondingAcct &&
      targetMint && 
      toNumber(tokenBondingAcct.supplyFromBonding, targetMint).toString()
    );
  }, [tokenBondingAcct, targetMint]);
  const bondStartSupply = 0;
  const bondEndSupply = tokenBondingAcct?.mintCap;
  const bondMaxTime = useMemo(() => {
    // @ts-ignore
    return curve?.definition.timeV0.curves[0].curve.timeDecayExponentialCurveV0
      .interval;
  }, [curve]);

  const numCharts = +priceVsSupply + +priceVsTime + +rateVsTime;
  const supplyOffset = useMemo(() => {
    if (tokenBondingAcct && targetMint) {
      return toNumber(tokenBondingAcct.supplyFromBonding.sub(targetMint.supply), targetMint)
    }
  }, [tokenBondingAcct, targetMint]);

  if (
    !bondTimeOffset ||
    !bondReserves ||
    !bondSupply||
    !bondEndSupply ||
    !bondMaxTime ||
    !curve
  ) {
    return <Box>Loading...</Box>;
  }



  const args = {
    timeOffset: timeOffset || bondTimeOffset?.toString(),
    setTimeOffset,
    reserves: reserves || bondReserves,
    setReserves,
    supply: supply || bondSupply,
    setSupply,
    startSupply: startSupply || bondStartSupply.toString(),
    setStartSupply,
    endSupply: endSupply || bondEndSupply?.toString(),
    setEndSupply,
    maxTime: maxTime || bondMaxTime.toString(),
    setMaxTime,
  };

  return (
    <VStack w="full">
      <SimpleGrid columns={3} w="full">
        <VStack>
          <label>Reserves</label>
          <Input
            type="number"
            step={0.001}
            onChange={(e) => setReserves(e.target.value)}
            value={args.reserves}
          />
        </VStack>
        <VStack>
          <label>Supply</label>
          <Input
            type="number"
            step={0.001}
            onChange={(e) => setSupply(e.target.value)}
            value={args.supply}
          />
        </VStack>
        <VStack>
          <label>Seconds since Launch</label>
          <Input
            type="number"
            step={1}
            onChange={(e) => setTimeOffset(e.target.value)}
            value={args.timeOffset}
          />
        </VStack>

        <VStack>
          <label>Start Supply</label>
          <Input
            type="number"
            step={0.001}
            onChange={(e) => setStartSupply(e.target.value)}
            value={args.startSupply}
          />
        </VStack>
        <VStack>
          <label>End Supply</label>
          <Input
            type="number"
            step={0.001}
            onChange={(e) => setEndSupply(e.target.value)}
            value={args.endSupply}
          />
        </VStack>
        <VStack>
          <label>Max Time</label>
          <Input
            type="number"
            step={1}
            onChange={(e) => setMaxTime(e.target.value)}
            value={args.maxTime}
          />
        </VStack>
      </SimpleGrid>
      <SimpleGrid columns={[1, 1, 1, 1, Math.min(numCharts, 2)]} w="full">
        {priceVsSupply && (
          <PriceVsSupplyDisplay
            supplyOffset={supplyOffset || 0}
            curveConfig={curve}
            {...args}
          />
        )}
        {priceVsTime && (
          <PriceVsTimeDisplay curveConfig={curve} {...args} />
        )}
        {rateVsTime && (
          <RateVsTimeDisplay curveConfig={curve} {...args} />
        )}
        {salesVsTime && (
          <EstimatedSalesVsTime curveConfig={curve} {...args} />
        )}
      </SimpleGrid>
    </VStack>
  );
}
