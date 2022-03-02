import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Box,
  Container,
  Flex,
  Stack,
  Heading,
  Text,
  Button,
  Link,
} from "@chakra-ui/react";

export const Bounties = () => (
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
          gap={2}
          w={{ base: "80%", md: "45%" }}
          align={["center", "center", "flex-start", "flex-start"]}
        >
          <Text fontSize="sm" fontWeight="semibold" color="cyan.500">
            APP SPOTLIGHT
          </Text>
          <Text fontSize="3xl" fontWeight="bold">
            Collective Bounties
          </Text>
          <Text>
            Strata Bounties allow you to setup and support projects you would
            like to see brought to life. Using Bounties, you can commission art
            projects or get your favorite musician to come to your city!{" "}
          </Text>
          <Stack direction="row" gap={2} w="full">
            <Button
              isFullWidth
              colorScheme="orange"
              as={Link}
              href="/bounties"
              _hover={{
                textDecoration: "none",
              }}
            >
              Try Bounties
            </Button>
            <Button
              isFullWidth
              colorScheme="orange"
              variant="outline"
              textColor="white"
              borderColor="orange.500"
              _hover={{ bg: "orange.500", textDecoration: "none" }}
              as={Link}
              href="/docs/marketplace/bounties"
            >
              View Bounties Docs
            </Button>
          </Stack>
        </Stack>
        <Box>Image here</Box>
      </Flex>
    </Container>
  </Box>
);
