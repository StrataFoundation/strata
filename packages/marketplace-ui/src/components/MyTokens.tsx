import {
  Box,
  Button,
  Container,
  Center,
  Stack,
  Text,
  Flex,
  VStack,
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import React, { useEffect, useState } from 'react';
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useProvider } from "@strata-foundation/react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenAccountParser } from "@strata-foundation/react";
import { truthy } from "@strata-foundation/spl-utils";
import { TokenItem } from "./TokenItem";

export const MyTokens = () => {
  const { publicKey, connected } = useWallet();
  const { visible, setVisible } = useWalletModal();
  const { provider } = useProvider();
  const [mints, setMints] = useState<PublicKey[]>([]);
  useEffect(() => {
    async function getTokenAccounts() {
      if (!publicKey || !provider) return;
      const accounts = await provider.connection.getTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID });
      const m = accounts.value.map((acc) => (TokenAccountParser(acc.pubkey, acc.account)?.info.mint)).filter(truthy);
      setMints(m);
    }
    getTokenAccounts();
  }, [publicKey, provider]);
  return (
    <>
      <Center padding="54px" backgroundColor="black.500">
        <Stack spacing={6}>
        <Text fontSize="2xl" color="white" textAlign="center">
          Welcome to
          <Text
            fontWeight="Bold"
            background="linear-gradient(to right,#FFCD01, #E17E44);"
            backgroundClip="text"
          >
            Strata Launchpad
          </Text>
        </Text>
      </Stack>
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
                <Text fontSize="3xl" color="black.500" fontWeight="bold">
                  My Tokens
                </Text>
                <Flex w="full" flexWrap="wrap" marginTop="2em">
                  <VStack w="full" alignItems="flex-start">
                    {mints.map((mint) => (
                      <TokenItem mint={mint} key={mint.toString()}/>
                    ))}
                  </VStack>
                </Flex>
              </Box>
            </Box>
          </Stack>
        </Container>
      </Box>
    </>
  )
};
    