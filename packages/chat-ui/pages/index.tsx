import {
  Container,
  Heading,
  VStack,
  Box
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { FeaturedCommunities } from "@/components/landing/FeaturedCommunities";
import { NewCommunities } from "@/components/landing/NewCommunities";
import { useWindowSize } from "@/hooks/useWindowSize";
import { Header } from "@/components/landing/Header";

const Home = () => {
  const router = useRouter();

  const [width, height] = useWindowSize();

  return (
    <Box height={height} width={width} overflow="auto">
      <Header />
      <Container maxW="container.lg" pt={8}>
        <VStack align="start" spacing={4} w="full">
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
