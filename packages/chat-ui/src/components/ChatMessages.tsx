import { useMessages } from "../hooks/useMessages";
import { Flex, VStack } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import React from "react";
import { Message } from "./Message";
import { IMessage } from "@strata-foundation/chat";
import { IPendingMessage } from "./Chatbox";
import { useWalletProfile } from "../hooks";

export function ChatMessages({
  scrollRef,
  messages,
  pendingMessages,
}: {
  scrollRef: any;
  messages?: IMessage[];
  pendingMessages?: IPendingMessage[];
}) {
  const { info: profile } = useWalletProfile();

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
        <Message key={msg?.id} {...msg} />
      ))}
      {pendingMessages?.map((msg, index) => (
        <Message
          key={msg?.txid + index}
          profileKey={profile?.publicKey}
          txid={msg.txid}
          {...msg.content}
          pending
        />
      ))}
      <div ref={scrollRef}></div>
    </VStack>
  );
}
