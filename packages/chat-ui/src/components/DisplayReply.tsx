import { Box, HStack, Text } from "@chakra-ui/react";
import { MessageType } from "@strata-foundation/chat";
import React from "react";
import { useAsync } from "react-async-hook";
import sanitizeHtml from "sanitize-html";
import { IMessageWithPending } from "../hooks";

const STYLE = {
  color: "gray.500",
  _hover: {
    cursor: "pointer",
    color: "black",
    _dark: {
      color: "white",
    },
  },
};

const BEFORE_STYLE = {
  content: `""`,
  position: "absolute",
  left: "50%",
  top: "8px",
  width: "2px",
  height: "12px",
  bg: "gray.300",
};

const AFTER_STYLE = {
  content: `""`,
  position: "absolute",
  left: "50%",
  top: "8px",
  width: "20px",
  height: "2px",
  bg: "gray.300",
};

export function DisplayReply({
  reply,
  htmlAllowList,
  scrollToMessage,
}: {
  reply: IMessageWithPending;
  htmlAllowList: any;
  scrollToMessage: (id: string) => void;
}) {
  const { result: decodedMessage } = useAsync(reply.getDecodedMessage, []);

  return (
    <HStack p={1} pb={0} w="full" align="start" spacing={2} fontSize="xs">
      <Box
        w="36px"
        h="100%"
        position="relative"
        _before={BEFORE_STYLE}
        _after={AFTER_STYLE}
        _dark={{
          _before: {
            bg: "gray.700",
          },
          _after: {
            bg: "gray.700",
          },
        }}
      />
      <HStack
        gap={0}
        spacing={1}
        onClick={() => scrollToMessage(reply.id)}
        {...STYLE}
      >
        {decodedMessage ? (
          // successfully decoded
          <>
            {reply.type === MessageType.Text ? (
              <Text>{decodedMessage.text}</Text>
            ) : reply.type === MessageType.Html ? (
              <Text
                noOfLines={2}
                dangerouslySetInnerHTML={{
                  __html: decodedMessage.html
                    ? sanitizeHtml(decodedMessage.html, htmlAllowList)
                    : "",
                }}
              />
            ) : (
              <Text>Click to see attachment</Text>
            )}
          </>
        ) : (
          // need to fetch more messages
          <Text>Click to find reply</Text>
        )}
      </HStack>
    </HStack>
  );
}
