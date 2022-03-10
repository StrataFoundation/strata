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
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";
import { mintMetadataServerSideProps } from "@/utils/tokenMetadataServerProps";
import { TokenOffering } from "@/components/TokenOffering";

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

  return (
    <Box
      w="full"
      backgroundColor="#f9f9f9"
      height="100vh"
      overflow="auto"
      paddingBottom="200px"
    >
      <Head>
        <meta
          property="twitter:url"
          content={`https://marketplace.strataprotocol.com/token-offering/${mintKey}/`}
        />
        <MetadataMeta name={name} description={description} image={image} />
      </Head>
      <Box padding="54px" backgroundColor="black.500" />
      <Container mt="-72px" justify="stretch" maxW="460px">
        <Heading mb={2} color="white" fontSize="24px" fontWeight={600}>
          Swap
        </Heading>
        <Box zIndex={1} bg="white" shadow="xl" rounded="lg" minH="400px">
          { typeof window != "undefined" && <TokenOffering mintKey={mintKey} /> }
        </Box>
      </Container>
    </Box>
  );
};

export default SwapDisplay;
