import { useChatPermissionsFromChat } from "../hooks/useChatPermissionsFromChat";
import { Avatar, HStack, Text, useColorModeValue } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { roundToDecimals, useTokenMetadata } from "@strata-foundation/react";
import { numberWithCommas } from "@strata-foundation/spl-utils";
import React, { Fragment, useMemo } from "react";
import { useChatOwnedAmounts } from "../hooks/useChatOwnedAmounts";

function IndividualTokenFlare({
  token,
  wallet,
  chat,
}: {
  token: PublicKey;
  wallet: PublicKey | undefined;
  chat: PublicKey | undefined;
}) {
  const { info: chatPermissions } = useChatPermissionsFromChat(chat);
  const { ownedReadAmount, ownedPostAmount, isSame, loading } =
    useChatOwnedAmounts(wallet, chat);
  const { image, metadata } = useTokenMetadata(token);
  const color = useColorModeValue("gray.500", "gray.400");

  if (loading || !chatPermissions) return null;

  const isReadToken = token.equals(chatPermissions.readPermissionKey);
  const amount = isReadToken ? ownedReadAmount : ownedPostAmount;

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
      <Text fontSize="xs" color={color}>
        {numberWithCommas(roundToDecimals(amount || 0, 2))}
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
