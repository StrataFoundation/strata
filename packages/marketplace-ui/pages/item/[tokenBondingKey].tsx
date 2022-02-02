import { MarketplaceItem } from "@/components/MarketplaceItem";
import { MetadataMeta } from "@/components/MetadataMeta";
import { Box, Center } from "@chakra-ui/react";
import { usePublicKey } from "@strata-foundation/react";
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { useRouter } from 'next/router';
import React from "react";
import { tokenBondingMetadataServerSideProps } from "utils/tokenMetadataServerProps";


export const getServerSideProps: GetServerSideProps =
  tokenBondingMetadataServerSideProps;


export const MarketDisplay: NextPage = ({ name, image, description }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter()
  const { tokenBondingKey: tokenBondingKeyRaw } = router.query;
  const tokenBondingKey = usePublicKey(tokenBondingKeyRaw as string);

  return (
    <Box h="100vh">
      <Head>
        <meta
          property="twitter:url"
          content={`https://marketplace.strataprotocol.com/item/${tokenBondingKeyRaw}/`}
        />
        <MetadataMeta name={name} description={description} image={image}/>
      </Head>
      <Box w="full" h="full" overflow="auto" paddingTop={{ sm: "18px" }}>
        <Center flexGrow={1}>
          <Center bg="white" shadow="xl" rounded="lg" maxW="600px">
            <MarketplaceItem
              name={name}
              description={description}
              image={image}
              tokenBondingKey={tokenBondingKey}
            />
          </Center>
        </Center>
      </Box>
    </Box>
  );
}

export default MarketDisplay;