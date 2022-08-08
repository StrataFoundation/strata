import { Disclaimer } from "../../../../src/components/Disclaimer";
import { Lbc } from "../../../../src/components/lbc/Lbc";
import { MetadataMeta } from "../../../../src/components/MetadataMeta";
import { SITE_URL } from "../../../../src/constants";
import { mintMetadataServerSideProps } from "../../../../src/utils/tokenMetadataServerProps";
import {
  Box, Container,
  DarkMode, useColorModeValue,
  VStack
} from "@chakra-ui/react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  usePublicKey
} from "@strata-foundation/react";
import {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage
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
          url={`${SITE_URL}/lbcs/token-offering/${id?.toString()}/`}
        />
        <VStack spacing={2} align="left">
          <Container mt={"35px"} justifyContent="stretch" maxW="600px">
            <Lbc id={id} onConnectWallet={onConnectWallet} />
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
