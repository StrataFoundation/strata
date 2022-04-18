import { DisburseFunds } from "@/components/DisburseFunds";
import { LbcStatus } from "@/components/lbc";
import { Branding } from "@/components/lbc/Branding";
import { LbcInfo } from "@/components/lbc/LbcInfo";
import { MetadataMeta } from "@/components/MetadataMeta";
import { TokenOffering } from "@/components/TokenOffering";
import { SITE_URL } from "@/constants";
import { useIsBountyAdmin } from "@/hooks/useIsBountyAdmin";
import { useLivePrice } from "@/hooks/useLivePrice";
import { mintMetadataServerSideProps } from "@/utils/tokenMetadataServerProps";
import {
  Box,
  Center,
  Container,
  DarkMode,
  Heading,
  Spinner,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
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
  const { publicKey } = useWallet();
  const { isAdmin } = useIsBountyAdmin(
    publicKey || undefined,
    tokenBonding?.publicKey
  );

  return (
    <Box
      color={useColorModeValue("black", "white")}
      w="full"
      backgroundColor="black.500"
      height="100vh"
      overflow="auto"
      paddingBottom="200px"
    >
      <MetadataMeta
        title={`Strata LBC Token Offering | ${name}`}
        description={description}
        image={image}
        url={`${SITE_URL}/bounty/${mintKey}/`}
      />
      <Container mt={"35px"} justify="stretch" maxW="460px">
        <VStack spacing={2} align="left">
          <Heading mb={2} fontSize="24px" fontWeight={600}>
            Swap
          </Heading>
          <LbcStatus tokenBondingKey={tokenBonding?.publicKey} />
          <Box
            zIndex={1}
            shadow="xl"
            rounded="lg"
            p="16px"
            pb="29px"
            minH="300px"
            bg="black.300"
          >
            {isAdmin && tokenBonding && (
              <Box
                p={4}
                borderBottom="3px solid"
                borderRadius="lg"
                borderColor="gray.300"
              >
                <Heading size="md">Disburse Funds</Heading>
                <DisburseFunds
                  tokenBondingKey={tokenBonding?.publicKey}
                  includeRetrievalCurve
                />
              </Box>
            )}
            {loading && (
              <Center>
                <Spinner />
              </Center>
            )}
            {!loading && tokenBonding && (
              <VStack align="stretch" spacing={8}>
                <LbcInfo
                  price={price}
                  tokenBondingKey={tokenBonding.publicKey}
                  useTokenOfferingCurve
                />
                <TokenOffering mintKey={mintKey} showAttribution={false} />
                <Branding />
              </VStack>
            )}
          </Box>
        </VStack>
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
