import { Box, Container, DarkMode, useColorModeValue } from "@chakra-ui/react";
import * as anchor from "@project-serum/anchor";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { usePublicKey } from "@strata-foundation/react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import React from "react";
import { DynamicPricingCandyMachine } from "../../../../src";

export interface HomeProps {
  candyMachineId?: anchor.web3.PublicKey;
}

export const Home = (props: HomeProps) => {
  const { setVisible } = useWalletModal();
  
  return (
    <Box
      color={useColorModeValue("black", "white")}
      w="full"
      backgroundColor="black.500"
      height="100vh"
      overflow="auto"
      paddingBottom="200px"
    >
      <Container mt={"35px"} justifyItems="stretch" maxW="600px">
        <DynamicPricingCandyMachine
          candyMachineId={props.candyMachineId}
          onConnectWallet={() => setVisible(true)}
        />
      </Container>
    </Box>
  );
};

export const DarkModeDisplay: NextPage<HomeProps> = (props) => {
  const router = useRouter();
  const { candyMachineId: candyMachineIdRaw } = router.query;
  const candyMachineId = usePublicKey(candyMachineIdRaw as string);
  
  return (
    <DarkMode>
      <Home {...props} candyMachineId={candyMachineId} />
    </DarkMode>
  );
};

export default DarkModeDisplay;
