import React from "react";
import { ICandyMachineState } from "../../../hooks/useCandyMachineInfo";
import { HStack, Text, VStack } from "@chakra-ui/react";
import { NATIVE_MINT } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useMint, useMetaplexTokenMetadata } from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import { BigText, BlackBox } from "../LbcInfo";
import * as anchor from "@project-serum/anchor";

export const CandyMachineInfo = ({ candyMachine, itemsRemaining, isWhitelistUser, discountPrice }: ICandyMachineState) => {
  const { metadata, loading: loadingMeta } = useMetaplexTokenMetadata(
    candyMachine?.tokenMint
  );
  const ticker = loadingMeta ? "" : metadata?.data.symbol || "SOL";
  const targetMint = useMint(candyMachine?.tokenMint || NATIVE_MINT);

  return (
    <HStack spacing={2} justify="stretch">
      <BlackBox w="full">
        <VStack spacing={0} align="left">
          <Text fontSize="sm">
            {isWhitelistUser && discountPrice ? "Discount Price" : "Price"}
          </Text>
          <BigText>
            {isWhitelistUser && discountPrice
              ? `${
                  targetMint && discountPrice
                    ? toNumber(discountPrice as anchor.BN, targetMint)
                    : ""
                } ${ticker}`
              : candyMachine
              ? `${
                  targetMint && candyMachine?.price
                    ? toNumber((discountPrice || candyMachine.price) as anchor.BN, targetMint)
                    : ""
                } ${ticker}`
              : ""}
          </BigText>
        </VStack>
      </BlackBox>
      <BlackBox w="full">
        <VStack spacing={0} align="left">
          <Text fontSize="sm">Remaining</Text>
          <BigText>{itemsRemaining}</BigText>
        </VStack>
      </BlackBox>
    </HStack>
  );
};