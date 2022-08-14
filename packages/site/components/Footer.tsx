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
import { BLOG_URL, DISCORD_INVITE_URL, DOCS_URL } from "../constants";

const sections = [
  {
    title: "Docs",
    items: [
      {
        title: "Tutorial",
        isExternal: false,
        href: `${DOCS_URL}`,
      },
    ],
  },
  {
    title: "Community",
    items: [
      {
        title: "Discord",
        isExternal: true,
        href: DISCORD_INVITE_URL,
      },
      {
        title: "Twitter",
        isExternal: true,
        href: "https://twitter.com/StrataProtocol",
      },
    ],
  },
  {
    title: "More",
    items: [
      {
        title: "Blog",
        isExternal: false,
        href: BLOG_URL,
      },
      {
        title: "GitHub",
        isExternal: true,
        href: "https://github.com/StrataFoundation/strata",
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
                    {item.isExternal && <Icon as={RiExternalLinkLine} />}
                  </HStack>
                </Link>
              ))}
            </VStack>
          ))}
        </Stack>
      </Container>
      <Center textColor="gray.400" w="full">
        Copyright © 2022 Strata Foundation.
      </Center>
    </VStack>
  );
};
