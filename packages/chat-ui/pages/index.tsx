import React from "react";
import {
  Container,
  Heading,
  VStack,
  Box
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { FeaturedCommunities } from "../src/components/landing/FeaturedCommunities";
import { NewCommunities } from "../src/components/landing/NewCommunities";
import { useWindowSize } from "../src/hooks/useWindowSize";
import { Header } from "../src/components/landing/Header";

const Home = () => {
  const router = useRouter();

  const [width, height] = useWindowSize();

  return (
    <Box height={height} width={width} overflow="auto">
      <Header />
      <Container maxW="container.lg" pt={8} pb={8}>
        <VStack
          className="featured-communities"
          align="start"
          spacing={4}
          w="full"
        >
          <FeaturedCommunities />
          <VStack align="start" spacing={4} w="full">
            <Heading as="h1" size="xl" fontWeight="extrabold">
              New Communites
            </Heading>
            <NewCommunities />
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default Home;
