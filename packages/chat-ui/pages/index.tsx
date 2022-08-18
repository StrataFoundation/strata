import React from "react";
import {
  Container,
  Heading,
  Stack,
  Flex,
  Box,
  Divider,
  Text,
  Image,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { FeaturedCommunities } from "../src/components/landing/FeaturedCommunities";
import { NewCommunities } from "../src/components/landing/NewCommunities";
import { useWindowSize } from "../src/hooks/useWindowSize";
import { Header } from "../src/components/landing/Header";
import { Footer } from "../src/components/landing/Footer";

const Home = () => {
  const router = useRouter();

  const [width, height] = useWindowSize();

  return (
    <Box height={height} width={width} overflow="auto" bg="gray.900">
      <Header />
      <Container maxW="container.lg" pt={8} pb={8}>
        <Stack
          direction="column"
          className="featured-communities"
          align="start"
          spacing={4}
          w="full"
        >
          <FeaturedCommunities />
          <Stack w="full" gap={9}>
            <Stack direction="row" justify="center" align="center" gap={4}>
              <Divider bg="white" />
              <Text
                flexShrink={0}
                fontWeight="bold"
                bg="linear-gradient(273.71deg, #E4873E 14.63%, #FBC00E 100.31%);"
                bgClip="text"
              >
                POWERED BY
              </Text>
              <Divider bg="white" />
            </Stack>
            <Stack
              direction="row"
              w="full"
              justifyContent="space-between"
              alignItems="center"
              gap={8}
              pb={4}
              flexWrap="wrap"
            >
              <Flex flexShrink={0}>
                <Image
                  src="lit-logo.png"
                  alt="lit"
                  filter="grayscale(1)"
                  h={6}
                />
              </Flex>
              <Flex flexShrink={0}>
                <Image
                  src="genesysgo-logo.png"
                  alt="genesysgo"
                  filter="grayscale(1)"
                  h={6}
                />
              </Flex>
              <Flex flexShrink={0}>
                <Image
                  src="orca-logo.png"
                  alt="orca"
                  filter="grayscale(1)"
                  h={6}
                />
              </Flex>
              <Flex flexShrink={0}>
                <Image
                  src="cardinal-logo.png"
                  alt="cardinal"
                  filter="grayscale(1)"
                  h={6}
                />
              </Flex>
              <Flex flexShrink={0}>
                <Image
                  src="metaplex-logo.png"
                  alt="metaplex"
                  filter="grayscale(1)"
                  h={3}
                />
              </Flex>
              <Flex flexShrink={0}>
                <Image
                  src="jupiter-logo.png"
                  alt="jupiter"
                  filter="grayscale(1)"
                  h={6}
                />
              </Flex>
            </Stack>
            <Divider bg="white" />
          </Stack>
          <NewCommunities />
        </Stack>
      </Container>
      <Footer />
    </Box>
  );
};

export default Home;
