import {
  Image,
  Stack,
  Text,
  Flex,
  Icon,
} from "@chakra-ui/react";
import React from 'react';
import { PublicKey } from '@solana/web3.js';
import { useEndpoint, useMetaplexTokenMetadata, useReserveAmount, useTokenSwapFromId } from "@strata-foundation/react";
import { MdSettings } from "react-icons/md";
import { useRouter } from "next/router";
import { routes, route } from "../../utils/routes";


interface LaunchPreviewProps {
  id: PublicKey | undefined;
  name: string | undefined;
  image: string | undefined;
}

export const LaunchPreview = ({ id, name, image }: LaunchPreviewProps) => {
  const { tokenBonding } = useTokenSwapFromId(id);
  const reserveAmount = useReserveAmount(tokenBonding?.publicKey);
  const { metadata } = useMetaplexTokenMetadata(tokenBonding?.baseMint);
  const router = useRouter();
  const { cluster } = useEndpoint();
  return (
    <Flex alignItems="center" w="full">
      <Image
        alt="Token logo"
        marginLeft="2em"
        w="50px"
        h="50px"
        borderRadius="50%"
        src={image}
      />
      <Stack 
        paddingLeft="10px" 
        onClick={() => {
          router.push(
            route(routes.tokenLbcAdmin, {
              id: id?.toString(),
              cluster,
            }),
            undefined,
            { shallow: true }
          )
        }}
        cursor="pointer"
      >
        <Text 
          fontSize="xl" 
          textAlign="left" 
          fontWeight="bold"
        >
          {name}
        </Text>
        <Text 
          fontSize="md" 
          marginTop="0 !important"
        >
          Amount raised: {reserveAmount} {metadata?.data?.symbol}
          </Text>
      </Stack>
      <Icon w="24px" h="24px" 
        as={MdSettings} 
        onClick={() => {
          router.push(
            route(routes.tokenLbcAdmin, {
              id: id?.toString(),
              cluster,
            }),
            undefined,
            { shallow: true }
          )
        }}
        cursor="pointer" marginLeft="auto" marginRight="2em" />
    </Flex>
  );
};
    