import { MetadataMeta } from "@/components/MetadataMeta";
import { Box, Center, Container, Heading, Spinner } from "@chakra-ui/react";
import {
  Swap,
  usePublicKey,
  useTokenBondingFromMint,
} from "@strata-foundation/react";
import {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import { useRouter } from "next/router";
import React from "react";
import { mintMetadataServerSideProps } from "@/utils/tokenMetadataServerProps";
import { SITE_URL } from "@/constants";

export const getServerSideProps: GetServerSideProps =
  mintMetadataServerSideProps;

export const SwapDisplay: NextPage = ({
  name,
  image,
  description,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const { mintKey: mintKeyRaw } = router.query;
  const mintKey = usePublicKey(mintKeyRaw as string);
  const { info: tokenBonding, loading } = useTokenBondingFromMint(mintKey);

  return (
    <Box
      w="full"
      backgroundColor="#f9f9f9"
      height="100vh"
      overflow="auto"
      paddingBottom="200px"
    >
      <MetadataMeta
        title={`Strata Swap | ${name}`}
        description={description}
        image={image}
        url={`${SITE_URL}/bounty/${mintKey}/`}
      />
      <Box padding="54px" backgroundColor="black.500" />
      <Container mt="-72px" justify="stretch" maxW="460px">
        <Heading mb={2} color="white" fontSize="24px" fontWeight={600}>
          Swap
        </Heading>
        <Box padding={4} zIndex={1} bg="white" shadow="xl" rounded="lg" minH="400px">
          {loading && (
            <Center>
              <Spinner />
            </Center>
          )}
          {!loading && tokenBonding && (
            <Swap tokenBondingKey={tokenBonding!.publicKey} />
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default SwapDisplay;
