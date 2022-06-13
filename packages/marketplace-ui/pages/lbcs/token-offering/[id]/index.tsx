import { DisburseFunds } from "@/components/DisburseFunds";
import { BondingPlot, LbcStatus, TransactionHistory } from "@/components/lbc";
import { Branding } from "@/components/lbc/Branding";
import { LbcInfo } from "@/components/lbc/LbcInfo";
import { MetadataMeta } from "@/components/MetadataMeta";
import { Disclaimer } from "@/components/Disclaimer";
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
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  usePublicKey,
  useTokenSwapFromId,
} from "@strata-foundation/react";
import {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import { useRouter } from "next/router";
import React, { useCallback } from "react";

export const getServerSideProps: GetServerSideProps =
  mintMetadataServerSideProps;

export const LbcDisplay: NextPage = ({
  name,
  image,
  description,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();

  const { id: idRaw } = router.query;
  const id = usePublicKey(idRaw as string);

  const { 
    tokenBonding, 
    loading,
  } = useTokenSwapFromId(id);

  const { price } = useLivePrice(tokenBonding?.publicKey);
  const { publicKey } = useWallet();
  const { isAdmin } = useIsBountyAdmin(
    publicKey || undefined,
    tokenBonding?.publicKey
  );

  const selectedProps = {
    borderBottom: "3px solid #F07733",
    fontWeight: "semibold",
  };

  const { visible, setVisible } = useWalletModal();

  const onConnectWallet = useCallback(
    () => setVisible(!visible),
    [visible, setVisible]
  );

  return (
    <>
      <Disclaimer />
      <Box
        color={useColorModeValue("black", "white")}
        w="full"
        backgroundColor="black.500"
        overflow="auto"
        minH="100vh"
        paddingBottom="200px"
      >
        <MetadataMeta
          title={`Strata LBC Token Offering | ${name}`}
          description={description}
          image={image}
          url={`${SITE_URL}/bounty/${id}/`}
        />
        <VStack spacing={2} align="left">
          <Container mt={"35px"} justifyContent="stretch" maxW="600px">
            <Tabs variant="unstyled" isLazy>
              <TabList borderBottom="none">
                <Tab _selected={selectedProps} fontWeight={"normal"}>
                  Swap
                </Tab>
                <Tab _selected={selectedProps} fontWeight={"normal"}>
                  Transactions
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel p={0} pt={4}>
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
                          id={id!}
                          useTokenOfferingCurve
                        />
                        <TokenOffering
                          onConnectWallet={onConnectWallet}
                          id={id!}
                        />
                      </VStack>
                    )}
                  </Box>
                </TabPanel>
                <TabPanel p={0} pt={4}>
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
                        <BondingPlot tokenBondingKey={tokenBonding.publicKey} />
                        <TransactionHistory
                          tokenBondingKey={tokenBonding.publicKey}
                        />
                      </VStack>
                    )}
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Container>
        </VStack>
      </Box>
    </>
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
