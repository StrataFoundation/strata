import { VStack } from "@chakra-ui/react";
import { IMessage } from "@strata-foundation/chat";
import React, { useEffect } from "react";
import { Message } from "./Message";

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
    <VStack
      grow="1"
      align="start"
      overflowY="scroll"
      spacing={2}
      h="full"
      p="10px"
    >
      {messages?.map((msg, index) => (
        <Message
          key={msg?.id}
          {...msg}
          showUser={
            !(
              messages[index - 1] &&
              messages[index - 1].profileKey.equals(msg.profileKey)
            )
          }
        />
      ))}
      <div ref={scrollRef}></div>
    </VStack>
  );
}
