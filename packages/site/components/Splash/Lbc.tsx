import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Flex,
  Stack,
  Image,
  Text,
  Button,
  Link,
} from "@chakra-ui/react";
import { DOCS_URL, MARKETPLACE_URL } from "../../constants";

export const Lbc = () => (
  <Box w="full" bg="gray.900" color="white">
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
        pt={{ base: 20, md: 0 }}
        pb={20}
      >
        <Image
          src="lbcChart.png"
          alt="Lbc Chart"
          height="340px"
          mt={{ base: 16, md: 16 }}
        />
        <Stack
          gap={2}
          w={{ base: "80%", md: "45%" }}
          align={["center", "center", "flex-start", "flex-start"]}
        >
          <Text fontSize="sm" fontWeight="semibold" color="cyan.500">
            AVOIDING BOTS
          </Text>
          <Text fontSize="3xl" fontWeight="bold">
            Liquidity Bootstrapping
            <br />
            Curve{" "}
            <Text as="span" fontWeight="normal">
              (LBC)
            </Text>
          </Text>
          <Text fontSize="md">
            Strata allows you to bootstrap liquidity by selling tokens with a
            dynamic price discovery mechanism. This style of sale is done by
            starting with a high price that lowers over time and increases with
            every purchase.
          </Text>
          <Stack direction="row" gap={2} w="full">
            <Button
              isFullWidth
              colorScheme="orange"
              variant="outline"
              textColor="white"
              borderColor="orange.500"
              _hover={{ bg: "orange.500", textDecoration: "none" }}
              as={Link}
              href={`${MARKETPLACE_URL}/launchpad/lbcs/new`}
            >
              Create LBC
            </Button>
            <Button
              isFullWidth
              variant="link"
              as={Link}
              href={`${DOCS_URL}/marketplace/lbc`}
              color="white"
            >
              How it Works
            </Button>
          </Stack>
        </Stack>
      </Flex>
    </Container>
  </Box>
);
