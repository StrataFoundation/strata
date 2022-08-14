import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Box,
  Container,
  Flex,
  Stack,
  Text,
  Button,
  Link,
} from "@chakra-ui/react";
import { DOCS_URL, MARKETPLACE_URL } from "../../constants";
import TextTransition, { presets } from "react-text-transition";

const callouts = [
  {
    image: "/easyToUse.png",
    heading: "Easy to Use",
    body: "Strata provides SDKs to launch Tokens in an instant. No Rust or Solana experience needed!",
    alt: "launch token solana",
  },
  {
    image: "/freeAndOpen.png",
    heading: "Free and Open",
    body: "Strata is free to use and Open Source. Launch your token without someone else taking a cut!",
    alt: "solana token launch",
  },
  {
    image: "/buildWithReact.png",
    heading: "Build Quickly with React",
    body: "Strata comes with hooks and helpers to make coding using React a breeze.",
    alt: "solana react",
  },
];

export const Hero = () => {
  const options = useMemo(
    () => [
      "Social Token",
      "GameFi Token",
      "DAO Token",
      "SubDAO Token",
      "Community Token",
    ],
    []
  );
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentOptionIndex(
        currentOptionIndex == options.length - 1 ? 0 : currentOptionIndex + 1
      );
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentOptionIndex, setCurrentOptionIndex, options]);

  return (
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
          <Stack
            spacing={6}
            w={{ base: "80%", md: "40%" }}
            align={["center", "center", "flex-start", "flex-start"]}
          >
            <Box
              fontSize="4xl"
              fontWeight="light"
              lineHeight="normal"
              color="white"
              textAlign={["center", "center", "left", "left"]}
            >
              The fastest way to
              <br />
              launch and grow your
              <br />
              <TextTransition
                className="gradient"
                inline
                style={{
                  color: "transparent",
                  fontWeight: "bold",
                }}
                text={options[currentOptionIndex]}
                springConfig={presets.default}
              />
            </Box>
            <Text
              fontSize="md"
              color="white"
              fontWeight="normal"
              lineHeight={1.5}
              textAlign={["center", "center", "left", "left"]}
            >
              Strata Protocol is an open-source protocol to launch tokens around
              a person, project, idea, or collective on Solana.
            </Text>
            <Stack direction="row" gap={2} w="full">
              <Button
                isFullWidth
                colorScheme="orange"
                as={Link}
                href={`${MARKETPLACE_URL}/launchpad`}
                _hover={{
                  textDecoration: "none",
                }}
                isExternal
              >
                Launch a Token
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
          <Box>
            <Image
              src="/hero.png"
              alt="solana social tokens"
              height="488px"
              width="714px"
            />
          </Box>
        </Flex>
        <Stack
          gap={4}
          direction={["column", "column", "row"]}
          width={{ base: "70%", md: "100%" }}
          margin="0 auto"
          pb={20}
        >
          {callouts.map((callout, index) => (
            <Box
              key={callout.heading}
              bgGradient="linear(to-b, orange.400, yellow.400);"
              p="2px"
              rounded="md"
              w="full"
              color="white"
            >
              <Box h="full" w="full" bg="gray.900" p={6} rounded="md">
                <Stack gap={1}>
                  <Box>
                    <Image
                      src={callout.image}
                      alt={callout.alt}
                      width="64px"
                      height="64px"
                    />
                  </Box>
                  <Text fontSize="lg" fontWeight="bold">
                    {callout.heading}
                  </Text>
                  <Text fontSize="xs">{callout.body}</Text>
                </Stack>
              </Box>
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
};
