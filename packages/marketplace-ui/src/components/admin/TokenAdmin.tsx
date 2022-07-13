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


export const TokenAdmin: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { visible, setVisible } = useWalletModal();

  const router = useRouter();
  const { mintKey: mintKeyRaw } = router.query;
  const mintKey = usePublicKey(mintKeyRaw as string);
  // const { metadata, data, image } = useTokenMetadata(mintKey);
  return (
    <>
      <Center padding="54px" backgroundColor="black.500">
        <Flex justifyContent="space-around" w="full">
          <TokenPreview mintKey={mintKey} />
          <Button
            colorScheme="orange"
            variant="outline"
          >
            Edit
          </Button>
        </Flex>
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
                  <Flex w="full" h="full" bg="white" opacity="0.6" />
                </Flex>
              )}
              <Flex w="full">
                Admin settings
              </Flex>
            </Box>
          </Stack>
        </Container>
      </Box>
    </>
      
  );
};
