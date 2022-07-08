import { MetadataMeta } from "@/components/MetadataMeta";
import { Box, Container, Heading } from "@chakra-ui/react";
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
import { Disclaimer } from "@/components/Disclaimer";
import { TokenOffering } from "@/components/TokenOffering";
import { DisburseFunds } from "@/components/DisburseFunds";
import { useWallet } from "@solana/wallet-adapter-react";
import { useIsBountyAdmin } from "@/hooks/useIsBountyAdmin";
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
  const { info: tokenBonding } = useTokenBondingFromMint(mintKey);
  const { publicKey } = useWallet();
  const { isAdmin } = useIsBountyAdmin(
    publicKey || undefined,
    tokenBonding?.publicKey
  );

  return (
    <>
      <Disclaimer />
      <Box
        w="full"
        backgroundColor="#f9f9f9"
        height="100vh"
        overflow="auto"
        paddingBottom="200px"
      >
        <MetadataMeta
          title={`Strata Token Offering | ${name}`}
          description={description}
          image={image}
          url={`${SITE_URL}/token-offering/${mintKey}/`}
        />
        <Box padding="54px" backgroundColor="black.500" />
        <Container mt="-72px" justifyContent="stretch" maxW="460px">
          <Heading mb={2} color="white" fontSize="24px" fontWeight={600}>
            Swap
          </Heading>
          <Box
            padding={4}
            zIndex={1}
            bg="white"
            shadow="xl"
            rounded="lg"
            minH="400px"
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
            {typeof window != "undefined" && (
              <TokenOffering mintKey={mintKey} />
            )}
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default SwapDisplay;
