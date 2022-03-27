import React from "react";
import Image from "next/image";
import {
  Box,
  Flex,
  Text,
  Stack,
  VStack,
  HStack,
  Divider,
  Container,
} from "@chakra-ui/react";

export const Investors: React.FC = () => (
  <Box w="full" bg="#191C2A" color="white">
    <Container maxW="container.lg">
      <Flex
        align="center"
        justify={{
          base: "center",
          md: "space-between",
          xl: "space-between",
        }}
        direction={{ base: "column-reverse", md: "row" }}
        wrap="nowrap"
        py={20}
      >
        <VStack spacing={10} w="full">
          <Stack
            spacing={6}
            w={{ base: "80%", md: "55%" }}
            align="center"
            color="white"
          >
            <Text
              fontSize="3xl"
              fontWeight="bold"
              bg="linear-gradient(273.71deg, #E4873E 14.63%, #FBC00E 100.31%);"
              bgClip="text"
            >
              Investors
            </Text>
            <Text align="center">
              We&apos;ve partnered strategically with some of the best minds in
              crypto because we want nothing but the best for you.
            </Text>
            <Divider />
          </Stack>
          <HStack
            gap={{
              base: 4,
              md: 20,
            }}
            wrap="wrap"
            justifyContent="center"
          >
            <Image
              src="/investorMulticoin.png"
              alt="multicoin capital"
              width="200px"
              height="94px"
            />
            <Image
              src="/investorSolana.png"
              alt="solana"
              width="200px"
              height="100px"
            />
            <Image
              src="/investorAsymmetric.png"
              alt="Asymmetric"
              width="200px"
              height="94px"
            />
            <Image
              src="/investorAlameda.png"
              alt="alameda reserch"
              width="200px"
              height="94px"
            />
            <Image
              src="/investorStartingLine.png"
              alt="Starting Line"
              width="200px"
              height="94px"
            />
          </HStack>
        </VStack>
      </Flex>
    </Container>
  </Box>
);
