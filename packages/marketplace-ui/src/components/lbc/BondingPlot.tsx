import {
  Box, Center,
  HStack,
  Icon, IconButton, Text, useColorModeValue, VStack
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { Spinner, useErrorHandler, useMint, useTokenBonding, useCurve } from "@strata-foundation/react";
import moment from "moment";
import React, { useMemo, useState } from "react";
import { BiRefresh } from "react-icons/bi";
import {
  CartesianGrid, Line,
  LineChart, ResponsiveContainer, XAxis,
  YAxis
} from "recharts";
import { numberWithCommas } from "../../utils/numberWithCommas";
import { gql, useQuery } from "@apollo/client";
import { fromCurve, asDecimal, toNumber } from "@strata-foundation/spl-token-bonding";

const GET_BONDING_CHANGES = gql`
  query GetBondingChanges(
    $address: PublicKey!
    $startUnixTime: NaiveDateTime!
    $stopUnixTime: NaiveDateTime!
    $limit: Int!
    $offset: Int!
  ) {
    enrichedBondingChanges(
      address: $address
      startUnixTime: $startUnixTime
      stopUnixTime: $stopUnixTime
      limit: $limit
      offset: $offset
    ) {
      reserveChange
      supplyChange
      insertTs
    }
  }
`;

function now(): number {
  return new Date().valueOf() / 1000;
}

export const BondingPlot = ({
  tokenBondingKey,
  numDataPoints=500,
}: {
  tokenBondingKey?: PublicKey;
  numDataPoints?: number;
}) => {
  const { info: tokenBonding, loading: loadingBonding } =
    useTokenBonding(tokenBondingKey);

  const { info: curve, loading: loadingCurve } = useCurve(tokenBonding?.curve);
  const [stopTime, setStopTime] = useState(now())

  const baseMint = useMint(tokenBonding?.baseMint);
  const targetMint = useMint(tokenBonding?.targetMint);
  const {
    data: { enrichedBondingChanges } = {},
    error,
    loading,
  } = useQuery<{
    enrichedBondingChanges: {
      reserveChange: string;
      supplyChange: string;
      insertTs: number;
    }[];
  }>(GET_BONDING_CHANGES, {
    variables: {
      address: tokenBondingKey,
      startUnixTime: Math.max(
        stopTime - 3 * 60 * 60 * 24,
        tokenBonding?.goLiveUnixTime?.toNumber() || 0
      ), // 24 hours
      stopUnixTime: stopTime,
      offset: 0,
      limit: 100000,
    },
  });
  const data = useMemo(() => {
    if (enrichedBondingChanges && tokenBonding && baseMint && targetMint && curve) {
      const changes = [...enrichedBondingChanges].sort((a, b) => a.insertTs - b.insertTs);
      const startTime = tokenBonding?.goLiveUnixTime?.toNumber() + 1; // shake off huge drops
      const step = (stopTime - startTime!) / numDataPoints;
      const result: any[] = [];

      let pointer = 0;
      let currReserve = toNumber(tokenBonding.reserveBalanceFromBonding, baseMint);
      let currSupply =
        toNumber(tokenBonding.supplyFromBonding, targetMint);

      let buyBaseRoyalty = asDecimal(tokenBonding.buyBaseRoyaltyPercentage);

      let royaltyFactor = 1/(1-buyBaseRoyalty); // default royalty charged on strata
      // calculate the initial reserve and supply of the lbc
      for (let c of changes) {
        let price = Math.abs((Number(c.reserveChange) / Math.pow(10, baseMint.decimals)) / (Number(c.supplyChange) / Math.pow(10, targetMint.decimals)));
        if (price === NaN || price === Infinity) continue;

        currReserve += (Number(c.reserveChange) / Math.pow(10, baseMint.decimals))*royaltyFactor;
        currSupply += (Number(c.supplyChange) / Math.pow(10, targetMint.decimals))*royaltyFactor;
      }

      // calculate the price at each step
      for (let i = startTime; i < stopTime; i += step) {
        // account for reserve and supply changes due to transactions
        while (changes.length > pointer && i > changes[pointer].insertTs) {
          let c = changes[pointer];
          currReserve -= (Number(c.reserveChange) / Math.pow(10, baseMint.decimals))*royaltyFactor;
          currSupply -= (Number(c.supplyChange) / Math.pow(10, targetMint.decimals))*royaltyFactor;

          pointer += 1;
        }
        const currPricing = fromCurve(
          curve,
          currReserve,
          currSupply,
          tokenBonding?.goLiveUnixTime?.toNumber()
        );
        
        const price = currPricing.current(Number(i), 0, 0);
        result.push({
          price,
          time: i * 1000,
        });
      }
      
      return result.filter(p => p.price !== NaN && p.price !== Infinity);
    }
    return [];
  }, [enrichedBondingChanges, baseMint, targetMint, curve, stopTime, tokenBonding]);

  const { handleErrors } = useErrorHandler();
  handleErrors(error);
  
  const labelColor = useColorModeValue("black", "white");
  const icoColor = useColorModeValue("black", "white");

  const longestLabelLength = useMemo(
    () =>
      Math.max(
        data
          .map((d) => numberWithCommas(d.price, 9))
          .reduce((acc, cur) => (cur.length > acc ? cur.length : acc), 0),
        1
      ),
    [data, baseMint]
  );

  if (loadingBonding || loadingCurve || !baseMint || !targetMint) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  return (
    <VStack spacing={4} w="full" align="left">
      <HStack spacing={0}>
        <Text fontSize="18px" fontWeight="700">
          Price History
        </Text>

        <IconButton
          aria-label="Fetch More"
          onClick={() => setStopTime(now())}
          isLoading={loading}
          color={icoColor}
          variant="link"
          icon={<Icon h="24px" w="24px" mb="-2px" as={BiRefresh} />}
        />
      </HStack>
      <Box w="full" h="136px">
        <ResponsiveContainer height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(229, 229, 229, 0.3)" />
            <XAxis
              tickCount={5}
              interval={0}
              dataKey="time"
              domain={["auto", "auto"]}
              name="Time"
              tickFormatter={(unixTime) => moment(unixTime).format("LT")}
              type="number"
            />
            <YAxis
              tickFormatter={(num) => numberWithCommas(num, baseMint.decimals)}
              tickCount={3}
              domain={["auto", "auto"]}
              tickLine={false}
              type="number"
              orientation="right"
              stroke={labelColor}
              width={longestLabelLength * 7}
              axisLine={false}
            />
            <Line
              isAnimationActive={false}
              dot={false}
              type="monotone"
              dataKey="price"
              stroke="#81fff0"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </VStack>
  );
};
