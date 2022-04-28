import {
  Box, Center,
  HStack,
  Icon, IconButton, Text, useColorModeValue, VStack
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { Spinner, useErrorHandler, useMint, useTokenBonding, useTokenBondingKey } from "@strata-foundation/react";
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
}: {
  tokenBondingKey: PublicKey;
}) => {
  const { info: tokenBonding, loading: loadingBonding } =
    useTokenBonding(tokenBondingKey);

  const [stopTime, setStopTime] = useState(now())

  const baseMint = useMint(tokenBonding?.baseMint);
  const targetMint = useMint(tokenBonding?.targetMint);
  const {
    data: { enrichedBondingChanges } = {},
    error,
    loading,
  } = useQuery<{ enrichedBondingChanges: { reserveChange: string, supplyChange: string, insertTs: number }[] }>(GET_BONDING_CHANGES, {
    variables: {
      address: tokenBondingKey,
      startUnixTime: stopTime - Math.max((60 * 60 * 24), (tokenBonding?.goLiveUnixTime?.toNumber() || 0)), // 24 hours
      stopUnixTime: stopTime,
      offset: 0,
      limit: 1000
    },
  });

  const data = useMemo(() => {
    if (enrichedBondingChanges && baseMint && targetMint) {
      return enrichedBondingChanges.map((c) => ({
        time: c.insertTs * 1000,
        price: Math.abs((Number(c.reserveChange) / Math.pow(10, baseMint.decimals)) / (Number(c.supplyChange) / Math.pow(10, targetMint.decimals))),
      })).filter(p => p.price !== NaN && p.price !== Infinity);
    }

    return [];
  }, [enrichedBondingChanges, baseMint, targetMint]);

  const { handleErrors } = useErrorHandler();
  handleErrors(error);
  
  const labelColor = useColorModeValue("black", "white");
  const icoColor = useColorModeValue("black", "white");

  const longestLabelLength = useMemo(
    () =>
      data
        .map((d) => numberWithCommas(d.price, 9))
        .reduce((acc, cur) => (cur.length > acc ? cur.length : acc), 0),
    [data, baseMint]
  );

  if (loadingBonding || !baseMint || !targetMint) {
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
