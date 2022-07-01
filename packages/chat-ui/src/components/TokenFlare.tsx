import { Avatar, HStack, Text } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { roundToDecimals, useTokenMetadata } from "@strata-foundation/react";
import { numberWithCommas } from "@strata-foundation/spl-utils";
import React, { Fragment, useMemo } from "react";
import { useChatOwnedAmount } from "../hooks";

function IndividualTokenFlare({
  token,
  wallet,
  chat,
}: {
  token: PublicKey;
  wallet: PublicKey | undefined;
  chat: PublicKey | undefined;
}) {
  const { amount, loading } = useChatOwnedAmount(wallet, chat);
  const { image, metadata } = useTokenMetadata(token);

  if (loading || !amount) {
    return null;
  }

  return (
    <HStack paddingLeft="2px" spacing={1} alignItems="flex-end">
      <Avatar
        alignSelf="center"
        w="12px"
        h="12px"
        mt="-1.5px"
        title={metadata?.data.symbol}
        src={image}
      />
      <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>
        {numberWithCommas(roundToDecimals(amount, 2))}
      </Text>
    </HStack>
  );
}
export function TokenFlare({
  tokens,
  wallet,
  chat,
}: {
  tokens: PublicKey[];
  wallet: PublicKey | undefined;
  chat: PublicKey | undefined;
}) {
  const uniqueTokens = useMemo(
    () =>
      [...new Set(tokens.map((t) => t.toBase58()))].map(
        (t) => new PublicKey(t)
      ),
    [tokens]
  );
  return (
    <Fragment>
      {uniqueTokens.map((token) => (
        <IndividualTokenFlare
          key={token?.toBase58()}
          token={token}
          wallet={wallet}
          chat={chat}
        />
      ))}
    </Fragment>
  );
}
