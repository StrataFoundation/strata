import React from "react";
import { useChatIdFromIdentifierCertificate } from "../../../src/hooks/useChatIdFromIdentifierCertificate";
import { GraphChat, useChats } from "../../../src/hooks/useChats";
import {
  Button,
  Center,
  Heading,
  HStack,
  Image,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { usePublicKey } from "@strata-foundation/react";
import { useRouter } from "next/router";
import { route, routes } from "../../routes";
import { ActiveUsers } from "./ActiveUsers";
import { FEATURED_COMMUNITIES } from "./FeaturedCommunities";

const Community = ({
  imageUrl,
  name,
  identifierCertificateMint,
  dailyActiveUsers,
}: GraphChat) => {
  const mintKey = usePublicKey(identifierCertificateMint);
  const { chatId: id } = useChatIdFromIdentifierCertificate(mintKey);
  const router = useRouter();

  return (
    <VStack
      position="relative"
      p="0"
      rounded="2xl"
      borderColor={useColorModeValue("gray.100", "gray.700")}
      borderWidth="1px"
    >
      <Image
        roundedTop="2xl"
        style={{ height: "60%" }}
        objectFit="cover"
        w="full"
        alt={name}
        src={imageUrl}
      />
      <VStack spacing={6} w="full" p={4}>
        <VStack align="stretch" w="full" spacing={2}>
          <Text
            mb="-10px"
            lineHeight="120%"
            fontWeight="extrabold"
            noOfLines={2}
            textAlign="left"
            fontSize="2xl"
          >
            {name}
          </Text>
          <Text
            fontSize="12px"
            color={useColorModeValue("gray.700", "gray.100")}
          >
            {id}.chat
          </Text>
          {/* <Text
              align="left"
              color={useColorModeValue("gray.600", "gray.200")}
            >
              {description}
            </Text> */}
        </VStack>
        <HStack spacing={2}>
          {typeof dailyActiveUsers !== "undefined" && (
            <ActiveUsers num={dailyActiveUsers!} fontSize="12px" />
          )}
        </HStack>
        <Button
          w="full"
          onClick={() =>
            router.push(
              route(routes.chat, {
                id,
              }),
              undefined,
              {
                shallow: true,
              }
            )
          }
          colorScheme="primary"
        >
          Join Now!
        </Button>
      </VStack>
    </VStack>
  );
};

const featuredKeys = new Set(FEATURED_COMMUNITIES.map((c) => c.publicKey));
export const NewCommunities = () => {
  const { chats } = useChats();

  if (chats.length == 0) return null;

  return (
    <Stack direction="column" align="start" spacing={4} w="full" pb="100px">
      <Heading as="h1" size="xl" fontWeight="extrabold">
        New Communities
      </Heading>
      <SimpleGrid columns={{ sm: 2, md: 3, lg: 4 }} spacing={4}>
        {chats
          .filter((chat) => !featuredKeys.has(chat.publicKey))
          .map((chat: GraphChat) => (
            <Community key={chat.publicKey} {...chat} />
          ))}
      </SimpleGrid>
    </Stack>
  );
};
