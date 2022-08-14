import React, { useEffect, useMemo } from "react";
import { CurveV0, fromCurve, ICurveConfig } from "@strata-foundation/spl-token-bonding";
import { useQueryString } from "@strata-foundation/react";
import { Box, SimpleGrid, VStack, Input } from "@chakra-ui/react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useVariables } from "../../theme/Root/variables";

const NUM_DATAPOINTS = 40;

export const PriceVsSupplyDisplay = ({
  curveConfig,
  timeOffset,
  setTimeOffset,
  reserves,
  setReserves,
  startSupply,
  setStartSupply,
  endSupply,
  setEndSupply,
  setSupply,
  supply,
  supplyOffset,
}: {
  curveConfig: CurveV0;
  timeOffset: string;
  setTimeOffset(args: string): void;
  reserves: string;
  setReserves(args: string): void;
  supply: string;
  setSupply(args: string): void;
  startSupply: string;
  setStartSupply(args: string): void;
  endSupply: string;
  setEndSupply(args: string): void;
  supplyOffset: number;
}) => {
  const startSupplyNum = Number(startSupply) + supplyOffset;
  const endSupplyNum = Number(endSupply) + supplyOffset;
  const supplyNum = Number(supply);
  const data = useMemo(() => {
    const beforeCurrPoint: { supply: number; price: number; total: number }[] =
      [];
    const step = (endSupplyNum - startSupplyNum) / NUM_DATAPOINTS;
    if (step <= 0) {
      return [];
    }
    let tempReserves = Number(reserves);
    for (let i = supplyNum; i > startSupplyNum; i -= step) {
      const currPricing = fromCurve(curveConfig, tempReserves, i, 0);
      const decr = currPricing.sellTargetAmount(step, 0, 0, Number(timeOffset));
      tempReserves -= decr;
      const price = fromCurve(
        curveConfig,
        tempReserves,
        i - step,
        0
      ).buyTargetAmount(1, 0, 0, Number(timeOffset));
      if (i - step >= 0 && price > 0) {
        beforeCurrPoint.push({
          supply: i - step,
          price,
          total: tempReserves,
        });
      }
    }

    const afterCurrPoint: { supply: number; price: number; total: number }[] =
      [];
    let tempReserves2 = Number(reserves);
    if (startSupplyNum > supplyNum) {
      tempReserves2 =
        tempReserves2 +
        fromCurve(
          curveConfig,
          tempReserves2,
          Number(supply),
          0
        ).buyTargetAmount(startSupplyNum - supplyNum, 0, 0, Number(timeOffset));
    }
    for (
      let i = Math.max(supplyNum, startSupplyNum);
      i <= endSupplyNum;
      i += step
    ) {
      const currPricing = fromCurve(curveConfig, tempReserves2, i, 0);
      const price = currPricing.buyTargetAmount(1, 0, 0, Number(timeOffset));
      const incr = currPricing.buyTargetAmount(step, 0, 0, Number(timeOffset));

      afterCurrPoint.push({
        supply: i,
        price,
        total: tempReserves2,
      });
      tempReserves2 += incr;
    }

    return [...beforeCurrPoint.reverse(), ...afterCurrPoint];
  }, [startSupply, curveConfig, reserves, supply, timeOffset, endSupply]);

  return (
    <VStack justify="stretch">
      <Box w="full" h="500px">
        <ResponsiveContainer width="100%" height="100%">
          {/* @ts-ignore */}
          <LineChart
            width={500}
            height={300}
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <ReferenceLine x={Number(supply)} stroke="orange" />
            {/* @ts-ignore */}
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              tickFormatter={(amount) =>
                Math.floor(amount - supplyOffset).toString()
              }
              tickCount={10}
              type="number"
              dataKey="supply"
              label={{ value: "Supply", dy: 10 }}
              domain={[startSupplyNum, endSupplyNum]}
            />
            <YAxis
              type="number"
              label={{
                value: "Price",
                position: "insideLeft",
                angle: -90,
                dy: 0,
              }}
            />
            {/* @ts-ignore */}
            <Tooltip />
            {/* @ts-ignore */}
            <Legend />

            {/* @ts-ignore */}
            <Line
              activeDot={{
                onClick: (e, payload) => {
                  //@ts-ignore
                  setSupply(payload.payload.supply);
                  //@ts-ignore
                  setReserves(payload.payload.total);
                },
              }}
              type="monotone"
              dataKey="price"
              stroke="#8884d8"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </VStack>
  );
};

export const RateVsTimeDisplay = ({
  curveConfig,
  reserves,
  supply,
  setTimeOffset,
  maxTime,
  timeOffset,
  setMaxTime,
}: {
  curveConfig: CurveV0;
  maxTime: string;
  timeOffset: string;
  setMaxTime(args: string): void;
  setTimeOffset(args: string): void;
  reserves: string;
  supply: string;
}) => {
  const data = useMemo(() => {
    const step = Number(maxTime) / NUM_DATAPOINTS;
    const ret: { timeOffset: number; rate: number }[] = [];
    for (let i = 0; i < Number(maxTime); i += step) {
      const currPricing = fromCurve(
        curveConfig,
        Number(reserves),
        Number(supply),
        0
      );
      const incAmt = 1
      const plusOnePricing = fromCurve(
        curveConfig,
        Number(reserves) + currPricing.buyTargetAmount(incAmt, 0, 0, Number(i)),
        Number(supply + incAmt),
        0
      );
      const priceIncrease =
        plusOnePricing.buyTargetAmount(incAmt, 0, 0, Number(i)) -
        currPricing.buyTargetAmount(incAmt, 0, 0, Number(i));
      const priceFall =
        currPricing.buyTargetAmount(incAmt, 0, 0, Number(i)) -
        currPricing.buyTargetAmount(incAmt, 0, 0, Number(i + 1));
      ret.push({
        rate: priceFall / priceIncrease,
        timeOffset: i,
      });
    }

    return ret;
  }, [curveConfig, reserves, supply, maxTime]);

  return (
    <VStack justify="stretch">
      <Box w="full" h="500px">
        <ResponsiveContainer width="100%" height="100%">
          {/* @ts-ignore */}
          <LineChart
            width={500}
            height={300}
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <ReferenceLine x={Number(timeOffset)} stroke="orange" />
            {/* @ts-ignore */}
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              tickCount={10}
              type="number"
              tickFormatter={(seconds) => Math.floor(formatTime(seconds, Number(maxTime))).toString()}
              dataKey="timeOffset"
              label={{ value: `Time (${getUnit(Number(maxTime))})`, dy: 10 }}
              domain={[0, Number(maxTime)]}
            />
            <YAxis
              type="number"
              label={{
                value: "Breakeven Sell Rate (units/sec)",
                position: "insideLeft",
                angle: -90,
                dy: 0,
              }}
            />
            {/* @ts-ignore */}
            <Tooltip />
            {/* @ts-ignore */}
            <Legend />
            {/* @ts-ignore */}
            <Line
              activeDot={{
                onClick: (e, payload) => {
                  //@ts-ignore
                  setTimeOffset(payload.payload.timeOffset);
                },
              }}
              type="monotone"
              dataKey="rate"
              stroke="#8884d8"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </VStack>
  );
};

export const EstimatedSalesVsTime = ({
  curveConfig,
  reserves,
  supply,
  setTimeOffset,
  maxTime,
  timeOffset,
  setMaxTime,
  endSupply,
}: {
  curveConfig: CurveV0;
  maxTime: string;
  timeOffset: string;
  setMaxTime(args: string): void;
  setTimeOffset(args: string): void;
  reserves: string;
  supply: string;
  endSupply: string;
}) => {
  const data = useMemo(() => {
    const step = Number(maxTime) / NUM_DATAPOINTS;
    const ret: { timeOffset: number; total: number }[] = [];
    for (let i = 0; i < Number(maxTime); i += step) {
      const currPricing = fromCurve(
        curveConfig,
        Number(reserves),
        Number(supply),
        0
      );
      const incAmt = 1;
      const plusOnePricing = fromCurve(
        curveConfig,
        Number(reserves) + currPricing.buyTargetAmount(incAmt, 0, 0, Number(i)),
        Number(supply + incAmt),
        0
      );
      const priceIncrease =
        plusOnePricing.buyTargetAmount(incAmt, 0, 0, Number(i)) -
        currPricing.buyTargetAmount(incAmt, 0, 0, Number(i));
      const priceFall =
        currPricing.buyTargetAmount(incAmt, 0, 0, Number(i)) -
        currPricing.buyTargetAmount(incAmt, 0, 0, Number(i + 1));

      const prev = ret[ret.length - 1] ? ret[ret.length - 1].total : 0;
      let total = (priceFall / priceIncrease) * step + prev;
      ret.push({
        total: total > Number(endSupply) ? 0 : total,
        timeOffset: i,
      });
    }

    return ret;
  }, [curveConfig, reserves, supply, maxTime]);

  return (
    <VStack justify="stretch">
      <Box w="full" h="500px">
        <ResponsiveContainer width="100%" height="100%">
          {/* @ts-ignore */}
          <LineChart
            width={500}
            height={300}
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <ReferenceLine x={Number(timeOffset)} stroke="orange" />
            {/* @ts-ignore */}
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              tickCount={10}
              type="number"
              tickFormatter={(seconds) =>
                Math.floor(formatTime(seconds, Number(maxTime))).toString()
              }
              dataKey="timeOffset"
              label={{ value: `Time (${getUnit(Number(maxTime))})`, dy: 10 }}
              domain={[0, Number(maxTime)]}
            />
            <YAxis
              type="number"
              label={{
                value: "Estimated Total Sales",
                position: "insideLeft",
                angle: -90,
                dy: 0,
              }}
            />
            {/* @ts-ignore */}
            <Tooltip />
            {/* @ts-ignore */}
            <Legend />

            {/* @ts-ignore */}
            <Line
              activeDot={{
                onClick: (e, payload) => {
                  //@ts-ignore
                  setTimeOffset(payload.payload.timeOffset);
                },
              }}
              type="monotone"
              dataKey="total"
              stroke="#8884d8"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </VStack>
  );
};

export const PriceVsTimeDisplay = ({
  curveConfig,
  reserves,
  supply,
  setTimeOffset,
  maxTime,
  timeOffset,
  setMaxTime,
}: {
  curveConfig: CurveV0;
  maxTime: string;
  timeOffset: string;
  setMaxTime(args: string): void;
  setTimeOffset(args: string): void;
  reserves: string;
  supply: string;
}) => {
  const data = useMemo(() => {
    const step = Number(maxTime) / NUM_DATAPOINTS;
    const ret: { timeOffset: number; price: number }[] = [];
    for (let i = 0; i < Number(maxTime); i += step) {
      const currPricing = fromCurve(
        curveConfig,
        Number(reserves),
        Number(supply),
        0
      );
      const price = currPricing.buyTargetAmount(1, 0, 0, Number(i));
      ret.push({
        price,
        timeOffset: i,
      });
    }

    return ret;
  }, [curveConfig, reserves, supply, maxTime]);

  return (
    <VStack justify="stretch">
      <Box w="full" h="500px">
        <ResponsiveContainer width="100%" height="100%">
          {/* @ts-ignore */}
          <LineChart
            width={500}
            height={300}
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <ReferenceLine x={Number(timeOffset)} stroke="orange" />
            {/* @ts-ignore */}
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              tickCount={10}
              type="number"
              tickFormatter={(seconds) =>
                Math.floor(formatTime(seconds, Number(maxTime))).toString()
              }
              dataKey="timeOffset"
              label={{ value: `Time (${getUnit(Number(maxTime))})`, dy: 10 }}
              domain={[0, Number(maxTime)]}
            />
            <YAxis
              type="number"
              label={{
                value: "Price",
                position: "insideLeft",
                angle: -90,
                dy: 0,
              }}
            />
            {/* @ts-ignore */}
            <Tooltip />
            {/* @ts-ignore */}
            <Legend />
            {/* @ts-ignore */}
            <Line
              activeDot={{
                onClick: (e, payload) => {
                  //@ts-ignore
                  setTimeOffset(payload.payload.timeOffset);
                },
              }}
              type="monotone"
              dataKey="price"
              stroke="#8884d8"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </VStack>
  );
};

function getUnit(maxTime: number): "seconds" | "hours" | "minutes" | "days" {
  if (maxTime < 60) {
    return "seconds"
  } else if (maxTime < 60 * 60) {
    return "minutes"
  } else if (maxTime < 60 * 60 * 72) {
    return "hours"
  } else {
    return "days"
  }
}

/**
 * Seconds from 0 to 60
 * Minutes from 0 to 60 minutes
 * Hours from 0 to 72 hours
 * Days onward
 */
function formatTime(time: number, maxTime: number): number {
  const unit = getUnit(maxTime);
  if (unit === "seconds") {
    return time
  } else if (unit === "minutes") {
    return time / 60
  } else if (unit === "hours") {
    return time / (60 * 60)
  } else {
    return time / (60 * 60 * 24)
  }
}

export type CurveConfiguratorFromVariablesProps = {
  priceVsSupply: boolean;
  priceVsTime: boolean;
  rateVsTime: boolean;
  salesVsTime: boolean;
};

export const CurveConfiguratorFromVariables = ({ 
  priceVsSupply = true,
  priceVsTime = true,
  rateVsTime = false,
  salesVsTime = false
}: CurveConfiguratorFromVariablesProps) => {
  const {
    curveConfig,
    startSupply: passedStartSupply,
    endSupply: passedEndSupply,
    reserves: passedReserves,
    supply: passedSupply,
    maxTime: passedMaxTime,
    supplyOffset,
  } = useVariables();

  const [timeOffset, setTimeOffset] = useQueryString("timeOffset", "0");
  const [reserves, setReserves] = useQueryString("reserves", "0");
  const [supply, setSupply] = useQueryString("supply", "0");
  const [startSupply, setStartSupply] = useQueryString("startSupply", passedStartSupply || "0");
  const [endSupply, setEndSupply] = useQueryString("endSupply", passedEndSupply || "100");
  const [maxTime, setMaxTime] = useQueryString("maxTime", passedMaxTime || "10");
  const args = {
    timeOffset,
    setTimeOffset,
    reserves,
    setReserves,
    supply,
    setSupply,
    startSupply,
    setStartSupply,
    endSupply,
    setEndSupply,
    maxTime,
    setMaxTime,
  }

  const numCharts = +priceVsSupply + +priceVsTime + +rateVsTime;

  useEffect(() => {
    passedReserves && setReserves(passedReserves);
  }, [passedReserves]);
  useEffect(() => {
    passedSupply && setSupply(passedSupply);
  }, [passedSupply]);
  useEffect(() => {
    passedEndSupply && setEndSupply(passedEndSupply);
  }, [passedEndSupply]);
  useEffect(() => {
    passedStartSupply && setStartSupply(passedStartSupply);
  }, [passedStartSupply]);
  useEffect(() => {
    passedMaxTime && setMaxTime(passedMaxTime);
  }, [passedMaxTime]);

  const rawCurve = curveConfig?.toRawConfig();

  if (!curveConfig) {
    return <Box padding={4} mb={4} rounded="lg" backgroundColor="gray.200" >Run the above code block to show curve</Box>
  }

  return (
    <VStack w="full">
      <SimpleGrid columns={3} w="full">
        <VStack>
          <label>Reserves</label>
          <Input
            type="number"
            step={0.001}
            onChange={(e) => setReserves(e.target.value)}
            value={reserves}
          />
        </VStack>
        <VStack>
          <label>Supply</label>
          <Input
            type="number"
            step={0.001}
            onChange={(e) => setSupply(e.target.value)}
            value={supply}
          />
        </VStack>
        <VStack>
          <label>Seconds since Launch</label>
          <Input
            type="number"
            step={1}
            onChange={(e) => setTimeOffset(e.target.value)}
            value={timeOffset}
          />
        </VStack>

        <VStack>
          <label>Start Supply</label>
          <Input
            type="number"
            step={0.001}
            onChange={(e) => setStartSupply(e.target.value)}
            value={startSupply}
          />
        </VStack>
        <VStack>
          <label>End Supply</label>
          <Input
            type="number"
            step={0.001}
            onChange={(e) => setEndSupply(e.target.value)}
            value={endSupply}
          />
        </VStack>
        <VStack>
          <label>Max Time</label>
          <Input
            type="number"
            step={1}
            onChange={(e) => setMaxTime(e.target.value)}
            value={maxTime}
          />
        </VStack>
      </SimpleGrid>
      <SimpleGrid columns={[1, 1, 1, Math.min(numCharts, 2)]} w="full">
        {priceVsSupply && (
          <PriceVsSupplyDisplay
            supplyOffset={supplyOffset || 0}
            curveConfig={rawCurve}
            {...args}
          />
        )}
        {priceVsTime && <PriceVsTimeDisplay curveConfig={rawCurve} {...args} />}
        {rateVsTime && <RateVsTimeDisplay curveConfig={rawCurve} {...args} />}
        {salesVsTime && (
          <EstimatedSalesVsTime curveConfig={rawCurve} {...args} />
        )}
      </SimpleGrid>
    </VStack>
  );
  
}