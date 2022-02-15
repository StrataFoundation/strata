import { BountyDetail } from "@/components/bounties/BountyDetail";
import { MetadataMeta } from "@/components/MetadataMeta";
import { Box, Center, Container, Image, Spinner } from "@chakra-ui/react";
import { Swap, usePublicKey, useTokenBondingFromMint, useTokenMetadata } from "@strata-foundation/react";
import {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";
import { mintMetadataServerSideProps } from "utils/tokenMetadataServerProps";

export const getServerSideProps: GetServerSideProps =
  mintMetadataServerSideProps;

export const LbpDisplay: NextPage = ({
  name,
  image,
  description,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const { mintKey: mintKeyRaw } = router.query;
  const mintKey = usePublicKey(mintKeyRaw as string);
  const { info: tokenBonding, loading } = useTokenBondingFromMint(mintKey)

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
          content={`https://marketplace.strataprotocol.com/bounty/${mintKey}/`}
        />
        <MetadataMeta name={name} description={description} image={image} />
      </Head>
      <Box padding="54px" backgroundColor="black.500" />
      <Container justify="stretch" maxW="640px">
        <Box zIndex={1} bg="white" shadow="xl" rounded="lg">
          {loading && <Spinner />}
          {!loading && tokenBonding && <Swap tokenBondingKey={tokenBonding!.publicKey} />}
        </Box>
      </Container>
    </Box>
  );
};

export default LbpDisplay;
