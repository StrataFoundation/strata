import {
  Box,
  Button,
  Text,
  Image,
} from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import React from 'react';
import { useRouter } from "next/router";
import { routes, route } from "../../utils/routes";
import { PublicKey } from "@solana/web3.js";

export const SellTokensButton = ({mintKey}: {mintKey: PublicKey | undefined}) => {
  const router = useRouter();
  return (
    <Box bgColor="black.500" color="white" borderRadius="8px" padding="30px" mb="10px !important" >
      <Image src="/swap.png" h="70px" marginBottom="20px" />
      <Text fontSize="lg" fontWeight="bold">Sell Existing Token</Text>
      <Text fontSize="md">You already have a token created that you would like to sell.</Text>
      <Button 
          bgColor="black.500" 
          rightIcon={<ArrowForwardIcon color="#f07733"/>} 
          _hover={{ bg: "black.500" }} 
          _active={{ bg: "black.500" }}
          padding="0"
          marginTop="20px"
          onClick={() => {
            router.push(
              route(routes.sell, {
                mint: mintKey?.toString(),
              }),
              undefined,
              { shallow: true }
            )
          }}
      >
        Start
      </Button>
    </Box>
  );
};
    