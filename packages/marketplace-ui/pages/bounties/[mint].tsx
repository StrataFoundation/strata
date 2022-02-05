import { BountyDetail } from "@/components/bounties/BountyDetail";
import { MetadataMeta } from "@/components/MetadataMeta";
import { Box, Center, Container } from "@chakra-ui/react";
import { usePublicKey } from "@strata-foundation/react";
import {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage
} from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";
import { mintMetadataServerSideProps } from "utils/tokenMetadataServerProps";

export const getServerSideProps: GetServerSideProps =
  mintMetadataServerSideProps;

export const MarketDisplay: NextPage = ({
  name,
  image,
  description,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const { mintKey: mintKeyRaw } = router.query;

  const mintKey = usePublicKey(mintKeyRaw as string);

  return (
    <Container w="full">
      <Head>
        <meta
          property="twitter:url"
          content={`https://marketplace.strataprotocol.com/bounty/${mintKey}/`}
        />
        <MetadataMeta name={name} description={description} image={image} />
      </Head>
      <Box w="full" h="full" overflow="auto" paddingTop={{ sm: "18px" }}>
        <Center flexGrow={1}>
          <Box bg="white" shadow="xl" rounded="lg" maxW="600px" minW="400px">
            <BountyDetail
              name={name}
              description={description}
              image={image}
              mintKey={mintKey}
            />
          </Box>
        </Center>
      </Box>
    </Container>
  );
};

export default MarketDisplay;
