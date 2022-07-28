import {
  Text,
  Flex,
  Image,
  Icon,
} from "@chakra-ui/react";
import { MdSettings } from "react-icons/md";
import { PublicKey } from "@solana/web3.js";
import React, { useMemo } from 'react';
import { useWallet } from "@solana/wallet-adapter-react";
import { useTokenAuthorities, useTokenBondingFromMint } from "@strata-foundation/react";
import { useRouter } from "next/router";
import { routes, route } from "../utils/routes";
import { MetadataData } from "@metaplex-foundation/mpl-token-metadata";

export const TokenItem = ({mint, updateRef, isIntermediateToken}: {
  mint: PublicKey,
  updateRef: number,
  isIntermediateToken: (mint: PublicKey, metadata: MetadataData, hasTokenBonding: boolean) => boolean
}) => {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { data, hasAnyAuth, image, metadata } = useTokenAuthorities(mint, publicKey || undefined);
  const { info: tokenBonding } = useTokenBondingFromMint(mint);
  const shouldDisplay = useMemo(() => {
    if (mint && metadata && hasAnyAuth) {
      return !isIntermediateToken(mint, metadata!, !!tokenBonding);
    }
  }, [updateRef, metadata, mint, hasAnyAuth, tokenBonding])
  return (
    <>
      { hasAnyAuth && shouldDisplay ? (
        <Flex bgColor="white" borderRadius="8px" w="full" h="7em" alignItems="center" mb="10px !important">
          <Flex
            onClick={() => {
              router.push(
                route(routes.tokenAdmin, {
                  mintKey: mint.toString(),
                }),
                undefined,
                { shallow: true }
              )
            }}
            cursor="pointer"
            alignItems="center"
          >
            <Image
              alt="Token logo"
              marginLeft="2em"
              w="50px"
              h="50px"
              borderRadius="50%"
              src={image}
            />

              <Text 
                fontSize="xl" 
                textAlign="left" 
                fontWeight="bold"
                paddingLeft="10px"
              >
                {data?.name}
              </Text>
          </Flex>
          <Flex 
            marginLeft="auto"
            onClick={() => {
              router.push(
                route(routes.tokenAdmin, {
                  mintKey: mint.toString(),
                }),
                undefined,
                { shallow: true }
              )
            }} 
            cursor="pointer"
          >
            <Text marginRight="10px">Manage Token</Text>
            <Icon 
              w="24px" h="24px" 
              as={MdSettings} 
              
              marginRight="2em" 
            />
          </Flex>
        </Flex>
      ) : null}
    </>
  )
};
      