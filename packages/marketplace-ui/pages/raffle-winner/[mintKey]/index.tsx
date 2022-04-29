import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Container,
  Center,
  Box,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Stack,
  Text,
  Spinner,
  Image,
  VStack,
  Heading,
} from "@chakra-ui/react";
import { usePublicKey, useTokenMetadata } from "@strata-foundation/react";

const suffleArray = (array: any[]) => {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const RaffleWinner: NextPage = () => {
  const router = useRouter();
  const { mintKey: mintKeyRaw } = router.query;
  const mint = usePublicKey(mintKeyRaw as string);
  const { image: targetImage } = useTokenMetadata(mint);
  const { connection } = useConnection();
  const [isLoading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<string | null>(
    "Retreving All Token Holders..."
  );
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (mint) {
        let holders: { [holder: string]: { amount: number } } = {};
        let entriesBucket = [];

        setStatus("Retreving All Token Holders...");
        await wait(1500);
        const accounts = await connection.getParsedProgramAccounts(
          TOKEN_PROGRAM_ID,
          {
            filters: [
              {
                dataSize: 165, // number of bytes
              },
              {
                memcmp: {
                  offset: 0, // number of bytes
                  bytes: mint.toBase58(),
                },
              },
            ],
          }
        );

        setStatus("Counting Up Entries...");
        await wait(1500);
        accounts.forEach((a: any, i) => {
          if (a.account.data.parsed.info.tokenAmount.uiAmount > 0) {
            // @ts-ignore
            if (!holders[a.account.data.parsed.info.owner]) {
              // @ts-ignore
              holders[a.account.data.parsed.info.owner] = {
                amount: +a.account.data.parsed.info.tokenAmount.uiAmount,
              };
            } else {
              // @ts-ignore
              holders[a.account.data.parsed.info.owner].amount +=
                +a.account.data.parsed.info.tokenAmount.uiAmount;
              // @ts-ignore
            }
          }
        });

        // Create a bucket of owners with their amount of entries
        for (const [key, value] of Object.entries(holders)) {
          entriesBucket.push(
            ...[...Array(value.amount).keys()].map((x) => key)
          );
        }

        setStatus(`Shuffling ${entriesBucket.length} entries...`);
        suffleArray(entriesBucket);
        await wait(1500);

        setStatus("Selecting Winner...");
        await wait(1500);

        setLoading(false);
        setWinner(
          entriesBucket[Math.floor(Math.random() * (entriesBucket.length - 1))]
        );
      }
    })();
  }, [mint, connection]);

  return (
    <Box w="full" backgroundColor="#f9f9f9" minHeight="100vh">
      <Container
        height="100vh"
        width="100vw"
        justifyContent="center"
        alignItems="center"
      >
        <Center w="full" h="100vh">
          {!winner && (
            <VStack>
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="orange.500"
                size="xl"
              />
              <Text fontSize="lg">
                <Box as="span" whiteSpace="nowrap" fontWeight="bold">
                  {status}
                </Box>
              </Text>
            </VStack>
          )}
          {winner && (
            <Modal
              isOpen={true}
              onClose={() => void 0}
              size="2xl"
              isCentered
              trapFocus={false}
            >
              <ModalContent borderRadius="xl" shadow="xl" bg="white">
                <ModalBody>
                  <Stack
                    spacing="6"
                    textAlign="center"
                    justifyContent="center"
                    alignItems="center"
                    py={12}
                  >
                    <Image
                      zIndex={1000}
                      rounded="xl"
                      background="#f9f9f9"
                      outline="3.15556px solid #E1E3E8"
                      marginLeft="auto"
                      marginRight="auto"
                      mt="-120px"
                      w="142px"
                      h="142px"
                      alt={"winner image"}
                      src={targetImage}
                    />
                    <Heading>Owner of winning raffle entry!</Heading>
                    <Text fontSize="lg">{winner}</Text>
                  </Stack>
                </ModalBody>
              </ModalContent>
            </Modal>
          )}
        </Center>
      </Container>
    </Box>
  );
};

export default RaffleWinner;
