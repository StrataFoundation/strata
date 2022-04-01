import { SaleItem } from "@/components/sales/SaleItem";
import { MetadataMeta } from "@/components/MetadataMeta";
import { Box, Container } from "@chakra-ui/react";
import { usePublicKey } from "@strata-foundation/react";
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

export const MarketDisplay: NextPage = ({
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
      minHeight="100vh"
      paddingBottom="200px"
    >
      <MetadataMeta
        title={`Strata Sales | ${name}`}
        description={description}
        image={image}
        cardType="summary_large_image"
        url={`${SITE_URL}/item/${mintKey}/`}
      />
      <Box padding="54px" backgroundColor="black.500" />
      <Container mt={"-50px"} justify="stretch" maxW="960px">
        <Box zIndex={1} bg="white" shadow="xl" rounded="lg">
          <SaleItem
            name={name}
            description={description}
            image={image}
            mintKey={mintKey}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default MarketDisplay;
