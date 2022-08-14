import React from "react";
import { Box, Text, Stack, Container, Button, Link } from "@chakra-ui/react";
import { DISCORD_INVITE_URL, DOCS_URL } from "../../constants";

export const GetStarted = () => (
  <Box w="full" bg="gray.900" color="white">
    <Container maxW="container.lg">
      <Stack gap={4} py={20} alignItems="center">
        <Text
          fontSize="3xl"
          fontWeight="bold"
          bg="linear-gradient(273.71deg, #E4873E 14.63%, #FBC00E 100.31%);"
          bgClip="text"
        >
          Get Started with Strata
        </Text>
        <Text w={{ base: "90%", md: "50%" }} align="center">
          Get started with Strata today so you can launch your Collective and
          build the token ecosystem of your dreams.{" "}
        </Text>
        <Stack direction="row" gap={2} w={{ base: "90%", md: "50%" }}>
          <Button
            isFullWidth
            colorScheme="orange"
            as={Link}
            href={DISCORD_INVITE_URL}
            _hover={{
              textDecoration: "none",
            }}
            isExternal
          >
            Join the Discord
          </Button>
          <Button
            isFullWidth
            colorScheme="orange"
            variant="outline"
            textColor="white"
            borderColor="orange.500"
            _hover={{ bg: "orange.500", textDecoration: "none" }}
            as={Link}
            href={DOCS_URL}
          >
            Developer Docs
          </Button>
        </Stack>
      </Stack>
    </Container>
  </Box>
);
