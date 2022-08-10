import React from "react";
import {
  Box,
  Container,
  Flex,
  Stack,
  Text,
  Button,
  Link,
  Image,
  Divider,
} from "@chakra-ui/react";
import { MARKETPLACE_URL, DOCS_URL } from "../../constants";

export const Bounties = () => (
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
        pt={20}
      >
        <Stack
          gap={2}
          w={{ base: "80%", md: "38%" }}
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
              href={`${MARKETPLACE_URL}/bounties`}
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
              href={`${DOCS_URL}/marketplace/bounties`}
              px={16}
            >
              View Bounties Docs
            </Button>
          </Stack>
        </Stack>
        <Box
          lineHeight="normal"
          width={{ base: "100%", md: "80%" }}
          ml={{
            base: 0,
            md: 14,
          }}
          mb={{ base: 16, md: 0 }}
        >
          <Stack
            bg="#191C2A"
            direction="row"
            gap={4}
            rounded="lg"
            border="1px solid white"
            p={8}
            ml={30}
          >
            <Image
              src="/dtpBounty.png"
              alt="Degen Trash Pandas Bounty"
              width="48px"
              height="48px"
            />
            <Stack spacing="4" justifyContent="left" flexWrap="wrap">
              <Text fontSize="xl" fontWeight="bold">
                The Degens take on plastic: Because a global problem needs a
                global $SOLution
              </Text>
              <Stack
                direction="row"
                gap={2}
                fontSize="sm"
                display={{ base: "none", sm: "flex" }}
              >
                <Text align="left">
                  <Text as="span" fontWeight="bold">
                    Requester
                  </Text>{" "}
                  @EndangeredDegen
                </Text>
                <Text align="left">
                  <Text as="span" fontWeight="bold">
                    Approver
                  </Text>{" "}
                  @EndangeredDegen
                </Text>
              </Stack>
              <Text fontSize="sm" color="gray.400">
                Created 1 day ago
              </Text>
            </Stack>
          </Stack>
          <Box
            bg="gray.900"
            display="inline-block"
            rounded="lg"
            border="1px solid"
            borderColor="cyan.500"
            p={4}
            pr={12}
            mt="-20px"
          >
            <Stack spacing="2">
              <Text>
                <Text as="span" fontWeight="bold">
                  1,018.201
                </Text>{" "}
                SOL
              </Text>
              <Text>Contributed</Text>
            </Stack>
          </Box>
          <Box
            mt="-40px"
            ml="200px"
            bgGradient="linear(to-b, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0))"
            bgClip="text"
            display={{ base: "none", sm: "flex" }}
          >
            <Stack>
              <Text fontSize="sm" fontWeight="bold" mb={2}>
                Top Contributors
              </Text>
              <Stack fontSize="sm" lineHeight="normal">
                <Stack direction="row" spacing={4} w="full" alignItems="center">
                  <Text>1</Text>
                  <Text>Gc9kFEDJaSv8PEGks...</Text>
                  <Text flexGrow={1} align="right" fontWeight="bold">
                    129.00
                  </Text>
                </Stack>
                <Divider color="gray.300" />
              </Stack>
              <Stack gap={1} fontSize="sm" lineHeight="normal">
                <Stack direction="row" spacing={4} w="full" alignItems="center">
                  <Text>2</Text>
                  <Stack direction="row" spacing={2} align="center">
                    <Image
                      src="/wumbo.png"
                      alt="Wumbo Logo"
                      height="24px"
                      opacity="0.6"
                    />
                    <Stack spacing={0}>
                      <Text>Wumbo Social</Text>
                      <Text fontSize="xs">soWum | @TeamWumbo</Text>
                    </Stack>
                  </Stack>
                  <Text flexGrow={1} align="right" fontWeight="bold">
                    61.07
                  </Text>
                </Stack>
                <Divider color="gray.500" />
              </Stack>
              <Stack fontSize="sm" lineHeight="normal">
                <Stack direction="row" spacing={4} w="full" alignItems="center">
                  <Text>3</Text>
                  <Text>7G8ocssMyZdvKZXD...</Text>
                  <Text flexGrow={1} align="right" fontWeight="bold">
                    43.50
                  </Text>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Flex>
    </Container>
  </Box>
);
