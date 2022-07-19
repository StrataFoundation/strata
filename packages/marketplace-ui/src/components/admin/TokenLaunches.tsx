import {
  Alert,
  Box,
  Image,
  Button,
  Container,
  Center,
  Stack,
  Text,
  Collapse,
  Flex,
  Input,
  Switch,
  VStack,
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { useTokenBondingFromMint } from "@strata-foundation/react";
import { LaunchPreview } from "./LaunchPreview";
import React from 'react';
import { IMetadataExtension } from "@strata-foundation/spl-utils";

interface TokenPreviewProps {
  mintKey: PublicKey | undefined;
  name: string | undefined;
  image: string | undefined;
}

export const TokenLaunches = ({ mintKey, name, image }: TokenPreviewProps) => {
  const { info: tokenBonding } = useTokenBondingFromMint(mintKey);

  return (
    <Flex bgColor="white" borderRadius="8px" w="full" h="7em">
      {tokenBonding ? (
        <LaunchPreview id={mintKey!} name={name} image={image}/>
      ) : (
        <Text padding="30px">Launch a token offering</Text>
      )}
    </Flex>

  );
};
  