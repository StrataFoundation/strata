import {
  Box, Center,
  HStack,
  Icon, IconButton, Text, useColorModeValue, VStack
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { Spinner, useErrorHandler, useTokenBonding } from "@strata-foundation/react";
import moment from "moment";
import React, { useMemo } from "react";
import { BiRefresh } from "react-icons/bi";
import {
  CartesianGrid, Line,
  LineChart, ResponsiveContainer, XAxis,
  YAxis
} from "recharts";
import { useSampledTransactions } from "../../hooks/useSampledTransactions";
import { numberWithCommas } from "../../utils/numberWithCommas";

export const BondingPlot = ({ tokenBondingKey }: { tokenBondingKey: PublicKey }) => {
  const { transactions, error, loadingInitial, loadingMore, fetchMore } = useSampledTransactions({
    address: tokenBondingKey,
    numTransactions: 40
  });
  const { handleErrors } = useErrorHandler();
  handleErrors(error);
  const { info: tokenBonding, loading: loadingBonding } = useTokenBonding(tokenBondingKey);
  const labelColor = useColorModeValue("black", "white");

  const data = useMemo(() => {
    return tokenBonding && transactions.map(transaction => {
      const reserveIdx = transaction.transaction.message.accountKeys
        .map((k) => k.toBase58())
        .indexOf(tokenBonding.baseStorage.toBase58());
      const preReserves = transaction.meta?.preTokenBalances?.find(
        (b) =>
          b.accountIndex == reserveIdx &&
          b.mint == tokenBonding.baseMint.toBase58()
      )?.uiTokenAmount.uiAmount;
      const postReserves = transaction.meta?.postTokenBalances?.find(
        (b) =>
          b.accountIndex == reserveIdx && b.mint == tokenBonding.baseMint.toBase58()
      )?.uiTokenAmount.uiAmount;
      const reserveChange = (postReserves || 0) - (preReserves || 0);

      const preToken = transaction.meta?.preTokenBalances
        ?.filter((b) => b.mint == tokenBonding.targetMint.toBase58())
        ?.map((v) => v.uiTokenAmount.uiAmount)
        ?.reduce((v1, v2) => (v1 || 0) + (v2 || 0), 0);
      const postToken = transaction.meta?.postTokenBalances
        ?.filter((b) => b.mint == tokenBonding.targetMint.toBase58())
        ?.map((v) => v.uiTokenAmount.uiAmount)
        ?.reduce((v1, v2) => (v1 || 0) + (v2 || 0), 0);
      
      const tokenChange = (postToken || 0) - (preToken || 0);

      return {
        price: reserveChange/tokenChange,
        time: (transaction.blockTime || 0) * 1000
      };
    }).filter(d => d.price)
  }, [transactions, tokenBonding])
  const icoColor = useColorModeValue("black", "white");

  if (loadingBonding || loadingInitial) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  if (!data || data.length == 0) {
    return <Text>No trades yet</Text>
  }

  return (
    <VStack spacing={4} w="full" align="left">
      <HStack spacing={0}>
        <Text fontWeight="700">Price History</Text>

        <IconButton
          aria-label="Fetch More"
          onClick={() => fetchMore(10)}
          isLoading={loadingMore}
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
              tickFormatter={(num) => numberWithCommas(num, 2)}
              tickCount={3}
              domain={["auto", "auto"]}
              tickLine={false}
              type="number"
              orientation="right"
              stroke={labelColor}
              width={40}
              axisLine={false}
            />
            <Line
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
}
