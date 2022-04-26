import React from "react";
import { PublicKey } from "@solana/web3.js";
import { VStack, HStack, Text, Checkbox, useDisclosure, TableContainer, Table, Thead, Tr, Th, Spinner, Td, Center, Box, TableColumnHeaderProps, Switch, Button, IconButton, useColorModeValue, Icon } from "@chakra-ui/react";
import { useTransactions } from "../../hooks/useTransactions";
import { useMint, useTokenBonding, useTokenBondingKey } from "@strata-foundation/react";
import { useMemo } from "react";
import moment from "moment";
import { numberWithCommas } from "../../utils/numberWithCommas";
import { useWallet } from "@solana/wallet-adapter-react";
import { BiRefresh } from "react-icons/bi";

const truncateSig = (pkeyStr: string): string => {
  return `${pkeyStr.substr(0, 4)}...${pkeyStr.substr(pkeyStr.length - 4)}`;
};
export const TransactionHistory = ({
  tokenBondingKey,
}: {
  tokenBondingKey: PublicKey;
}) => {
  const { info: tokenBonding, loading: loadingBonding } =
    useTokenBonding(tokenBondingKey);
  const { isOpen: mineOnly, onToggle } = useDisclosure();
  const { result: sellOnlyTokenBondingKey, error: keyError1 } =
    useTokenBondingKey(tokenBonding?.targetMint, 1);
  if (keyError1) {
    console.error(keyError1);
  }
  const { info: sellOnlyTokenBonding, loading: sellOnlyLoading } =
    useTokenBonding(sellOnlyTokenBondingKey);

  const { publicKey } = useWallet();
  const address = useMemo(
    () => (mineOnly ? publicKey || undefined : tokenBondingKey),
    [publicKey, tokenBondingKey, mineOnly]
  );
  const { transactions, fetchMore, loadingInitial, fetchNew, loadingMore } = useTransactions(
    {
      numTransactions: 20,
      address,
    }
  );
  const baseMint = useMint(tokenBonding?.baseMint);
  const targetMint = useMint(tokenBonding?.targetMint);

  const data = useMemo(() => {
    return tokenBonding && !sellOnlyLoading
      ? transactions
          .map((transaction) => {
            const reserveIdx = transaction.transaction.message.accountKeys
              .map((k) => k.toBase58())
              .indexOf(tokenBonding.baseStorage.toBase58());
            const sellOnlyReserveIdx =
              transaction.transaction.message.accountKeys
                .map((k) => k.toBase58())
                .indexOf(sellOnlyTokenBonding?.baseStorage.toBase58() || "");
            const preReserves = transaction.meta?.preTokenBalances?.find(
              (b) =>
                b.accountIndex == reserveIdx &&
                b.mint == tokenBonding.baseMint.toBase58()
            )?.uiTokenAmount.uiAmount;
            const postReserves = transaction.meta?.postTokenBalances?.find(
              (b) =>
                b.accountIndex == reserveIdx &&
                b.mint == tokenBonding.baseMint.toBase58()
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

            const preSellOnlyReserves =
              transaction.meta?.preTokenBalances?.find(
                (b) =>
                  b.accountIndex == sellOnlyReserveIdx &&
                  b.mint == sellOnlyTokenBonding?.baseMint.toBase58()
              )?.uiTokenAmount.uiAmount;
            const postSellOnlyReserves =
              transaction.meta?.postTokenBalances?.find(
                (b) =>
                  b.accountIndex == sellOnlyReserveIdx &&
                  b.mint == sellOnlyTokenBonding?.baseMint.toBase58()
              )?.uiTokenAmount.uiAmount;
            const sellOnlyChange =
              (preSellOnlyReserves || 0) - (postSellOnlyReserves || 0);

            return {
              price: reserveChange / Math.max(tokenChange, sellOnlyChange),
              volume: Math.max(tokenChange, sellOnlyChange),
              time: (transaction.blockTime || 0) * 1000,
              signature: transaction.transaction.signatures[0],
            };
          })
          .filter((d) => d.price)
      : [];
  }, [transactions, tokenBonding, sellOnlyLoading, sellOnlyTokenBonding]);
  const icoColor = useColorModeValue("black", "white");

  const thProps: TableColumnHeaderProps = {
    textTransform: "none",
    color: "white",
    fontSize: "14px",
    letterSpacing: "none",
    padding: 4,
  };
  return (
    <VStack spacing={4} w="full" align="left">
      <HStack justify="space-between">
        <Text fontSize="18px" fontWeight="700">
          Recent Transactions
        </Text>
        <HStack spacing={1}>
          {publicKey && (
            <Switch size="sm" onChange={() => onToggle()}>
              Mine Only
            </Switch>
          )}
          <IconButton
            aria-label="Fetch New Transactions"
            title="Fetch New Transactions"
            onClick={() => fetchMore(20)}
            isLoading={loadingMore}
            color={icoColor}
            variant="link"
            icon={<Icon h="24px" w="24px" mb="-2px" as={BiRefresh} />}
          />
        </HStack>
      </HStack>
      <TableContainer>
        <Table variant="simple">
          <Thead variant="unstyled">
            <Tr>
              <Th {...thProps}>Volume</Th>
              <Th {...thProps}>Price</Th>
              <Th {...thProps}>Time</Th>
            </Tr>
          </Thead>

          {data.map(({ price, volume, time, signature }) => {
            return (
              <Tr
                onClick={() =>
                  window.open(
                    `https://explorer.solana.com/tx/${signature}`,
                    "_blank"
                  )
                }
                _hover={{ background: "#303947", cursor: "pointer" }}
                key={signature}
              >
                <Td>{numberWithCommas(volume, targetMint?.decimals)}</Td>
                <Td>{numberWithCommas(price, baseMint?.decimals)}</Td>
                <Td title={moment(time).format("llll")}>
                  {moment(time).fromNow()}
                </Td>
              </Tr>
            );
          })}
        </Table>
      </TableContainer>
      {loadingInitial && (
        <Box w="100%">
          <Center>
            <Spinner />
          </Center>
        </Box>
      )}
      <Button color="gray.500" variant="ghost" onClick={() => fetchMore(20)}>
        Show More
      </Button>
    </VStack>
  );
};