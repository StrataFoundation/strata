import {
  Alert,
  Box,
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
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/router";
import { usePublicKey, useTokenMetadata } from "@strata-foundation/react";
import { TokenPreview } from "./TokenPreview";
import { TokenLaunches } from "./TokenLaunches";
import { TokenAuthorityForm } from "../form/TokenAuthorityForm";
import { MintTokensWidget } from "./MintTokensWidget";
import { SellTokensButton } from "./SellTokensButton";
import { route, routes } from "../../utils/routes";
import React from 'react';

export const TokenAdmin: React.FC = () => {
  const { connected } = useWallet();
  const { visible, setVisible } = useWalletModal();

  const router = useRouter();
  const { mintKey: mintKeyRaw } = router.query;
  const mintKey = usePublicKey(mintKeyRaw as string);
  const { metadata, mint, data, image } = useTokenMetadata(mintKey);
  return (
    <>
      <Center padding="54px" backgroundColor="black.500">
        <Container maxW="container.lg" display="flex" justifyContent="space-between">
          <TokenPreview data={data} image={image} />
          <Button
            borderColor="primary.500"
            color="white"
            variant="outline"
            onClick={() => {
              router.push(
                route(routes.editMetadata, {
                  mintKey: mintKey?.toString(),
                }),
                undefined,
                { shallow: true }
              )
            }}
          >
            Edit
          </Button>
        </Container>
      </Center>
      <Box w="full" py={12} bgColor="gray.100">
        <Container maxW="container.lg">
          <Stack spacing={8} justifyContent="center">
            <Box position="relative">
            {!connected && (
              <Flex
                position="absolute"
                w="full"
                h="full"
                zIndex="1"
                flexDirection="column"
              >
                <Flex justifyContent="center">
                  <Button
                    colorScheme="orange"
                    variant="outline"
                    onClick={() => setVisible(!visible)}
                  >
                    Connect Wallet
                  </Button>
                </Flex>
                <Flex w="full" h="full" bg="gray.100" opacity="0.6" />
              </Flex>
            )}
              <Box w="full">
                <Text fontSize="2xl" color="black.500" fontWeight="bold">
                  Admin Settings
                </Text>
                <Flex w="full" flexWrap="wrap" marginTop="2em">
                  <VStack w={{ base: "100%", md: "65%" }} alignItems="flex-start">
                    <Text fontSize="xl" color="black.500" fontWeight="bold">Launches</Text>
                    <TokenLaunches mintKey={mintKey} name={data?.name} image={image} />
                    <Text fontSize="xl" color="black.500" fontWeight="bold">Authority Preferences</Text>
                    <TokenAuthorityForm values={{}} metadata={metadata} mint={mint} mintKey={mintKey} />
                  </VStack>
                  <VStack w={{ base: "100%", md: "35%" }} alignItems="flex-start" paddingLeft="30px">
                    <Text fontSize="xl" color="black.500" fontWeight="bold">Token Actions</Text>
                    <SellTokensButton mintKey={mintKey}/>
                    <MintTokensWidget values={{}} mintKey={mintKey} mint={mint}/>
                  </VStack>
                </Flex>
              </Box>
            </Box>
          </Stack>
        </Container>
      </Box>
    </>
      
  );
};
