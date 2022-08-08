import { BountyDetail } from "../../../src/components/bounties/BountyDetail";
import { MetadataMeta } from "../../../src/components/MetadataMeta";
import { Box, Container, Image } from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import {
  useFtxPayLink,
  usePublicKey,
  useTokenMetadata,
  useTwWrappedSolMint,
} from "@strata-foundation/react";
import {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import { useRouter } from "next/router";
import React from "react";
import { mintMetadataServerSideProps } from "../../../src/utils/tokenMetadataServerProps";
import { route, routes } from "../../../src/utils/routes";
import { SITE_URL } from "../../../src/constants";
import { PublicKey } from "@solana/web3.js";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";

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
  const { image: targetImage } = useTokenMetadata(mintKey);

  const wsol = useTwWrappedSolMint();
  const ftxPayLink = useFtxPayLink();

  return (
    <Box
      w="full"
      backgroundColor="#f9f9f9"
      minHeight="100vh"
      paddingBottom="200px"
    >
      <MetadataMeta
        title={`Strata Bounty | ${name}`}
        description={description}
        image={image}
        url={`${SITE_URL}/bounty/${mintKey}/`}
      />
      <Box padding="54px" backgroundColor="black.500" />
      <Container justifyContent="stretch" maxW="640px">
        <Image
          zIndex={1000}
          rounded="xl"
          background="#f9f9f9"
          outline="3.15556px solid #E1E3E8"
          mb="-22px"
          mt="-60px"
          marginLeft="auto"
          marginRight="auto"
          w="142px"
          h="142px"
          alt={name}
          src={targetImage || image}
        />
        <Box zIndex={1} bg="white" shadow="xl" rounded="lg" p={2}>
          <BountyDetail
            onBuyMore={(mint: PublicKey) => {
              if (mint.equals(wsol!)) {
                window.open(ftxPayLink);
              } else {
                router.push(
                  route(routes.swap, { mintKey: mint.toBase58() }),
                  undefined,
                  { shallow: true }
                );
              }
            }}
            onEdit={() =>
              router.push(
                route(routes.editBounty, {
                  mintKey: mintKey?.toBase58(),
                }),
                undefined,
                { shallow: true }
              )
            }
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
