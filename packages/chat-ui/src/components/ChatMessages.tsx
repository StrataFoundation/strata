import { VStack } from "@chakra-ui/react";
import { IMessage } from "@strata-foundation/chat";
import React, { useEffect } from "react";
import { Message } from "./Message";

const INACTIVE_TIME = 60; // After 1 minute, new grouping

export function ChatMessages({
  scrollRef,
  messages,
}: {
  scrollRef: any;
  messages?: IMessage[];
}) {
  useEffect(() => {
    if (messages) scrollRef.current.scrollIntoView();
  }, [messages]);

  return (
    <VStack grow="1" align="start" overflowY="scroll" spacing={0} h="full">
      {messages?.map((msg, index) => (
        <Message
          key={msg?.id}
          {...msg}
          showUser={
            !(
              messages[index - 1] &&
              messages[index - 1].profileKey.equals(msg.profileKey) &&
              messages[index - 1].endBlockTime >=
                (msg.startBlockTime || new Date().valueOf() / 1000) -
                  INACTIVE_TIME
            )
          }
        />
      ))}
      <div ref={scrollRef}></div>
    </VStack>
  );
}
