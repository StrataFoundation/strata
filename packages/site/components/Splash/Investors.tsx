import React from "react";
import {
  Box,
  Flex,
  Text,
  Stack,
  VStack,
  HStack,
  Divider,
  Container,
  Image,
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
          <VStack justifyContent="center" spacing={4}>
            <Flex w="full" justifyContent="center">
              <Image
                w="600px"
                src="/investorMulticoin.png"
                alt="multicoin capital"
              />
            </Flex>
            <HStack
              wrap="wrap"
              justifyContent="center"
              spacing={{ base: 0, md: 8 }}
            >
              <Image w="400px" src="/investorSolana.png" alt="solana" />
              <Image
                w="300px"
                src="/investorStartingLine.png"
                alt="starting line"
              />
            </HStack>
            <HStack wrap="wrap" justify="center" spacing={{ base: 0, md: 12 }}>
              <Image
                w="300px"
                src="/investorAlameda.png"
                alt="alameda research"
              />
              <Image
                w="300px"
                src="/investorAsymmetric.png"
                alt="asymmetric capital partners"
              />
            </HStack>
          </VStack>
        </VStack>
      </Flex>
    </Container>
  </Box>
);
