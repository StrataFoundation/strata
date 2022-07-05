import {
  Box,
  HStack,
  Icon,
  TextProps,
  Text,
} from "@chakra-ui/react";
import { MessageType, IMessage } from "@strata-foundation/chat";
import { sleep } from "@strata-foundation/spl-utils";
import React, { useMemo } from "react";
import { useAsync, useAsyncCallback } from "react-async-hook";
import { MdReply } from "react-icons/md";
import sanitizeHtml from "sanitize-html";
import { useMessages } from "../hooks";
import { PublicKey } from "@solana/web3.js";

export function DisplayReply({
  chatKey,
  replyToMessageId,
  htmlAllowList,
  scrollRef,
  messages,
}: {
  chatKey: PublicKey | undefined;
  replyToMessageId: string | undefined | null;
  htmlAllowList: any;
  scrollRef: any;
  messages: IMessage[];
}) {

  const { hasMore } = useMessages(chatKey, true, 25);

  // If this message is replying to another, try and find it
  const replyToMessage = useMemo(() => {
    return messages?.find((x) => x.id === replyToMessageId);
  }, [replyToMessageId, messages]);

  const getDecodedMessageOrIdentity =
    replyToMessage?.getDecodedMessage || (() => Promise.resolve(undefined));
  const {
    result: decodedMessage,
  } = useAsync(getDecodedMessageOrIdentity, [replyToMessage, messages]);

  const { execute: scrollToMessage } = useAsyncCallback(async function() {
    // listen to escape key press to break loop
    let breakLoop = false;
    function keyPress(e: any) {
      if(e.key === "Escape") {
        breakLoop = true;
      }
    }
    document.addEventListener("keypress", keyPress)
    while (!breakLoop && hasMore) {
      let findElem = document.getElementById(replyToMessageId as string);
      if (findElem) {
        findElem.scrollIntoView({behavior: "smooth", block: "center"});
        return;
      }
      // scroll to the top which should load more messages
      scrollRef.current.scroll({top: -scrollRef.current.scrollHeight, behavior: "smooth"});
      await sleep(300);
    }
    document.removeEventListener("keypress", keyPress);
  });

  return (
    <Box onClick={scrollToMessage}>
      {replyToMessageId && (
        <>
          {decodedMessage && replyToMessage ? ( // successfully decoded
            <>
              {replyToMessage.type === MessageType.Text ? (
                <Text mt={"-4px"}><Icon as={MdReply} />{decodedMessage.text}</Text>
              ) : replyToMessage.type === MessageType.Html ? (
                <HStack><Icon as={MdReply} />
                <Text display={"block"} width={"100px"} overflow={"hidden"} whiteSpace={"nowrap"} textOverflow={"ellipsis"}
                  dangerouslySetInnerHTML={{
                    __html: decodedMessage.html
                      ? sanitizeHtml(decodedMessage.html, htmlAllowList)
                      : "",
                  }}
                />
                </HStack>
              ): <Text mt={"-4px"}><Icon as={MdReply} /> Click to see attachment</Text>
                }
            </>
          ) : ( // need to fetch more messages
            <>
              <Text mt={"-4px"}><Icon as={MdReply} /> Click to find reply</Text>
            </>
          ) 
          }
        </>
      )}
    </Box>
  );
}

