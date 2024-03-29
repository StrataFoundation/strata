import {
  Center,
  Container,
  HStack,
  Icon,
  Link,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import React from "react";
import { RiExternalLinkLine } from "react-icons/ri";
const sections = [
  {
    title: "Docs",
    items: [
      {
        title: "Tutorial",
        href: "https://docs.strataprotocol.com/im/getting_started",
      },
    ],
  },
  {
    title: "Community",
    items: [
      {
        title: "Discord",
        href: "https://discord.gg/XQhCFg77WM",
      },
      {
        title: "Twitter",
        href: "https://twitter.com/StrataProtocol",
      },
    ],
  },
  {
    title: "Policies",
    items: [
      {
        title: "Terms of Service",
        href: "/terms-of-service.pdf",
      },
      {
        title: "Privacy Policy",
        href: "/privacy-policy.pdf",
      },
    ],
  },
  {
    title: "More",
    items: [
      {
        title: "Blog",
        href: "https://www.strataprotocol.com/blog",
      },
      {
        title: "GitHub",
        href: "https://github.com/StrataFoundation/strata",
      },
      {
        title: "Launchpad",
        href: "https://app.strataprotocol.com",
      },
    ],
  },
];
export const Footer = () => {
  return (
    <VStack bg="#191C2A" pt="60px" pb="120px">
      <Container maxW="container.lg">
        <Stack spacing={16} direction={["column", "row"]}>
          {sections.map(({ title, items }) => (
            <VStack align="left" key={title}>
              <Text fontWeight={700} fontSize="15px" color="white">
                {title}
              </Text>
              {items.map((item) => (
                <Link
                  href={item.href}
                  key={item.title}
                  fontWeight={400}
                  fontSize="15px"
                  color="orange.500"
                  isExternal
                >
                  <HStack spacing={1}>
                    <Text>{item.title}</Text>
                    <Icon as={RiExternalLinkLine} />
                  </HStack>
                </Link>
              ))}
            </VStack>
          ))}
        </Stack>
      </Container>
      <Center textColor="rgba(255, 255, 255, 0.49)" w="full">
        Copyright © 2022 Strata Foundation.
      </Center>
    </VStack>
  );
};
