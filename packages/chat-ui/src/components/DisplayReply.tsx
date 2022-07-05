import { Box, HStack, Icon, Text } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { MessageType } from "@strata-foundation/chat";
import React from "react";
import { useAsync } from "react-async-hook";
import { MdReply } from "react-icons/md";
import sanitizeHtml from "sanitize-html";
import { IMessageWithPending } from "../hooks";

const HOVER_STYLE = { cursor: "pointer" };
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
    <Box _hover={HOVER_STYLE} onClick={() => scrollToMessage(reply.id)} w="full">
      <>
        {decodedMessage ? ( // successfully decoded
          <>
            {reply.type === MessageType.Text ? (
              <Text mt={"-4px"}>
                <Icon as={MdReply} />
                {decodedMessage.text}
              </Text>
            ) : reply.type === MessageType.Html ? (
              <HStack>
                <Icon as={MdReply} />
                <Text
                  noOfLines={2}
                  dangerouslySetInnerHTML={{
                    __html: decodedMessage.html
                      ? sanitizeHtml(decodedMessage.html, htmlAllowList)
                      : "",
                  }}
                />
              </HStack>
            ) : (
              <Text mt={"-4px"}>
                <Icon as={MdReply} /> Click to see attachment
              </Text>
            )}
          </>
        ) : (
          // need to fetch more messages
          <>
            <Text mt={"-4px"}>
              <Icon as={MdReply} /> Click to find reply
            </Text>
          </>
        )}
      </>
    </Box>
  );
}
