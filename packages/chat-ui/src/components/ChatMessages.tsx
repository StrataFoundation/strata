import { useMessages } from "../hooks/useMessages";
import { Flex, usePrevious, VStack } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import React, { useEffect } from "react";
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
      {messages?.map((msg) => (
        <Message key={msg?.id} {...msg} />
      ))}
      {pendingMessages?.map((msg, index) => (
        <Message
          key={msg?.txid + index}
          profileKey={profile?.publicKey}
          txid={msg.txid}
          decodedMessage={msg.content}
          pending
        />
      ))}
      <div ref={scrollRef}></div>
    </VStack>
  );
}
