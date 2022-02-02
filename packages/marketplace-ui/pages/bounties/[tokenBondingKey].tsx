import { BountyDetail } from "@/components/bounties/BountyDetail";
import { MarketplaceItem } from "@/components/MarketplaceItem";
import { MetadataMeta } from "@/components/MetadataMeta";
import { Box, Center, Container, VStack } from "@chakra-ui/react";
import { usePublicKey } from "@strata-foundation/react";
import {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";
import { tokenBondingMetadataServerSideProps } from "utils/tokenMetadataServerProps";

export const getServerSideProps: GetServerSideProps =
  tokenBondingMetadataServerSideProps;

export const MarketDisplay: NextPage = ({
  name,
  image,
  description,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const { tokenBondingKey: tokenBondingKeyRaw } = router.query;
  const tokenBondingKey = usePublicKey(tokenBondingKeyRaw as string);

  return (
    <Container w="full">
      <Head>
        <meta
          property="twitter:url"
          content={`https://marketplace.strataprotocol.com/bounty/${tokenBondingKeyRaw}/`}
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
              tokenBondingKey={tokenBondingKey}
            />
          </Box>
        </Center>
      </Box>
    </Container>
  );
};

export default MarketDisplay;
