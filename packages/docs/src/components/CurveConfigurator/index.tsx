import React, { useMemo } from "react";
import { fromCurve, ICurveConfig } from "@strata-foundation/spl-token-bonding";
import { useQueryString } from "@strata-foundation/react";
import { Box, SimpleGrid, VStack, Input } from "@chakra-ui/react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const NUM_DATAPOINTS = 30;

export const CurveConfigurator = ({ curve }: { curve: ICurveConfig }) => {
  const [timeOffset, setTimeOffset] = useQueryString("timeOffset", "0");
  const [reserves, setReserves] = useQueryString("reserves", "0");
  const [supply, setSupply] = useQueryString("supply", "0");
  const [endSupply, setEndSupply] = useQueryString("endSupply", "2000");
  const curveConfig = useMemo(() => curve.toRawConfig(), [curve]);
  const data = useMemo(() => {
    const beforeCurrPoint: { supply: number; price: number; total: number }[] =
      [];
    const step = Number(endSupply) / NUM_DATAPOINTS;
    if (step === 0) {
      return [];
    }
    let tempReserves = Number(reserves);
    for (let i = Number(supply); i > 0; i -= step) {
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
    for (let i = Number(supply); i <= Number(endSupply); i += step) {
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
  }, [curveConfig, reserves, supply, timeOffset, endSupply]);

  return (
    <VStack justify="stretch">
      <SimpleGrid columns={4}>
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
          <label>Seconds since Launch</label>
          <Input
            type="number"
            step={1}
            onChange={(e) => setTimeOffset(e.target.value)}
            value={timeOffset}
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
          <label>End Supply</label>
          <Input
            type="number"
            step={0.001}
            onChange={(e) => setEndSupply(e.target.value)}
            value={endSupply}
          />
        </VStack>
      </SimpleGrid>
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
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              tickCount={10}
              type="number"
              dataKey="supply"
              label={{ value: "Supply", dy: 10 }}
              domain={[0, Number(endSupply)]}
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
