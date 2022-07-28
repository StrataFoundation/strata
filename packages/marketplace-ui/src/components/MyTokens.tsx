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
import React, { useCallback, useEffect, useState } from 'react';
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useProvider } from "@strata-foundation/react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenAccountParser } from "@strata-foundation/react";
import { truthy } from "@strata-foundation/spl-utils";
import { TokenItem } from "./TokenItem";
import { MetadataData } from "@metaplex-foundation/mpl-token-metadata";

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


  const [tokensRecord, setTokensRecord] = useState<Record<string,Set<string>>>({});
  const [updateRef, setUpdateRef] = useState<number>(0);
  // TODO this intermediate token detection is flawed, if bonding curve is closed no way to detect which is the real token to display
  const isIntermediateToken = useCallback(
    (mint: PublicKey, metadata: MetadataData, hasTokenBonding: boolean) => {
      function serialize(metadata: MetadataData): string {
        return `${metadata.data.name} - ${metadata?.data?.symbol}`
      }
      const serial = serialize(metadata);
      if (serial in tokensRecord) {
        if (tokensRecord[serial].has(mint.toString())) {
          if (tokensRecord[serial].size > 1 && hasTokenBonding) {
            return true
          }
          return false;
        } else {
          tokensRecord[serial].add(mint.toString());
          setUpdateRef(updateRef + 1); // calls a rerender which will trigger this callback to run again from child component
          return false;
        }
      }
      tokensRecord[serial] = new Set([mint.toString()])
      return false
    },
    []
  );
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
                      <TokenItem mint={mint} updateRef={updateRef} isIntermediateToken={isIntermediateToken} key={mint.toString()}/>
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
    