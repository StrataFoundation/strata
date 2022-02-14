import React, { useEffect, useMemo } from "react";
import { fromCurve, ICurveConfig } from "@strata-foundation/spl-token-bonding";
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

const NUM_DATAPOINTS = 30;

export const PriceVsSupplyDisplay = ({
  curve,
  timeOffset,
  setTimeOffset,
  reserves,
  setReserves,
  startSupply,
  setStartSupply,
  endSupply,
  setEndSupply,
  setSupply,
  supply
}: {
  curve: ICurveConfig;
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
}) => {
  const curveConfig = useMemo(() => curve.toRawConfig(), [curve]);
  const data = useMemo(() => {
    const beforeCurrPoint: { supply: number; price: number; total: number }[] =
      [];
    const step = (Number(endSupply) - Number(startSupply)) / NUM_DATAPOINTS;
    if (step <= 0) {
      return [];
    }
    let tempReserves = Number(reserves);
    for (let i = Number(supply); i > Number(startSupply); i -= step) {
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
    if (Number(startSupply) > Number(supply)) {
      tempReserves2 =
        tempReserves2 +
        fromCurve(
          curveConfig,
          tempReserves2,
          Number(supply),
          0
        ).buyTargetAmount(
          Number(startSupply) - Number(supply),
          0,
          0,
          Number(timeOffset)
        );
    }
    for (
      let i = Math.max(Number(supply), Number(startSupply));
      i <= Number(endSupply);
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
            <ReferenceLine x={Number(supply)} stroke="orange"/>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              tickCount={10}
              type="number"
              dataKey="supply"
              label={{ value: "Supply", dy: 10 }}
              domain={[Number(startSupply), Number(endSupply)]}
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
            <Tooltip />
            <Legend />

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

export const PriceVsTimeDisplay = ({
  curve,
  reserves,
  supply,
  setTimeOffset,
  maxTime,
  timeOffset,
  setMaxTime,
}: {
  curve: ICurveConfig;
  maxTime: string;
  timeOffset: string;
  setMaxTime(args: string): void;
  setTimeOffset(args: string): void;
  reserves: string;
  supply: string;
}) => {
  const curveConfig = useMemo(() => curve.toRawConfig(), [curve]);
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
            <ReferenceLine
              x={Number(timeOffset)}
              stroke="orange"
            />
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              tickCount={10}
              type="number"
              dataKey="timeOffset"
              label={{ value: "Time (seconds)", dy: 10 }}
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
            <Tooltip />
            <Legend />

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


export const CurveConfiguratorFromVariables = () => {
  const {
    curveConfig,
    startSupply: passedStartSupply,
    endSupply: passedEndSupply,
    reserves: passedReserves,
    supply: passedSupply
  } = useVariables();

  const [timeOffset, setTimeOffset] = useQueryString("timeOffset", "0");
  const [reserves, setReserves] = useQueryString("reserves", "0");
  const [supply, setSupply] = useQueryString("supply", "0");
  const [startSupply, setStartSupply] = useQueryString("startSupply", passedStartSupply || "0");
  const [endSupply, setEndSupply] = useQueryString("endSupply", passedEndSupply || "0");
  const [maxTime, setMaxTime] = useQueryString("maxTime", "10");
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

  useEffect(() => {
    setReserves(passedReserves);
  }, [passedReserves]);
  useEffect(() => {
    setSupply(passedSupply);
  }, [passedSupply]);
  useEffect(() => {
    setEndSupply(passedEndSupply);
  }, [passedEndSupply]);
  useEffect(() => {
    setStartSupply(passedStartSupply);
  }, [passedStartSupply]);

  if (!curveConfig) {
    return <div>Run the above code block to show curve</div>
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
      <SimpleGrid columns={[1, 1, 2]} w="full">
        <PriceVsSupplyDisplay curve={curveConfig} {...args} />
        <PriceVsTimeDisplay curve={curveConfig} {...args} />
      </SimpleGrid>
    </VStack>
  );
  
}