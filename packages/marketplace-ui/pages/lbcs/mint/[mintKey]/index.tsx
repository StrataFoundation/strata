import { Branding } from "@/components/lbc/Branding";
import { LbcInfo } from "@/components/lbc/LbcInfo";
import { MintButton } from "@/components/lbc/MintButton";
import { MetadataMeta } from "@/components/MetadataMeta";
import { useLivePrice } from "@/hooks/useLivePrice";
import { mintMetadataServerSideProps } from "@/utils/tokenMetadataServerProps";
import {
  Box,
  Center, Container, DarkMode, Heading,
  Spinner, useColorModeValue, VStack
} from "@chakra-ui/react";
import {
  usePublicKey,
  useTokenBondingFromMint
} from "@strata-foundation/react";
import {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage
} from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";

export const getServerSideProps: GetServerSideProps =
  mintMetadataServerSideProps;

export const LbcDisplay: NextPage = ({
  name,
  image,
  description,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const { mintKey: mintKeyRaw } = router.query;
  const mintKey = usePublicKey(mintKeyRaw as string);
  const { info: tokenBonding, loading } = useTokenBondingFromMint(mintKey);
  const { price } = useLivePrice(tokenBonding?.publicKey);

  return (
    <Box
      color={useColorModeValue("black", "white")}
      w="full"
      backgroundColor="black.500"
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
      <Container mt={"35px"} justify="stretch" maxW="460px">
        <Heading mb={2} fontSize="24px" fontWeight={600}>
          Mint
        </Heading>
        <Box
          zIndex={1}
          shadow="xl"
          rounded="lg"
          p="16px"
          pb="29px"
          minH="300px"
          bg="black.300"
        >
          {loading && (
            <Center>
              <Spinner />
            </Center>
          )}
          {!loading && tokenBonding && (
            <VStack align="stretch" spacing={8}>
              <LbcInfo price={price} tokenBondingKey={tokenBonding.publicKey} />
              <MintButton
                price={price}
                tokenBondingKey={tokenBonding.publicKey}
              />
              <Branding />
            </VStack>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export const DarkModeDisplay: NextPage = (props) => {
  return (
    <DarkMode>
      <LbcDisplay {...props} />
    </DarkMode>
  );
};

export default DarkModeDisplay;