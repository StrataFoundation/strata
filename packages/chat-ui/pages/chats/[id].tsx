import { Chatbox, IPendingMessage } from "@/components/Chatbox";
import { ChatMessages } from "@/components/ChatMessages";
import { Container } from "@/components/Container";
import { RoomsHeader } from "@/components/rooms/RoomsHeader";
import { Sidebar } from "@/components/Sidebar";
import { useChatKeyFromIdentifier } from "@/hooks/useChatKeyFromIdentifier";
import { useMessages } from "@/hooks/useMessages";
import { Flex, useMediaQuery } from "@chakra-ui/react";
import { useErrorHandler } from "@strata-foundation/react";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useRef, useState } from "react";

export default function Chatroom() {
  const [isMobile] = useMediaQuery('(max-width: 768px)')
  const router = useRouter()
  const { id } = router.query
  const lastMessage = useRef(null)
  const { chatKey } = useChatKeyFromIdentifier(id as string | undefined)
  const [pendingMessages, setPendingMessages] = useState<IPendingMessage[]>([]);
  const { messages, error } = useMessages(chatKey);
  const { handleErrors } = useErrorHandler();
  handleErrors(error)
  
  const txWeHave = useMemo(
    () => new Set(Array.from(messages?.map((message) => message.txid) || [])),
    [messages]
  );

  useEffect(() => {
    setPendingMessages((pendingMessages) =>
      pendingMessages.filter((p) => !txWeHave.has(p.txid))
    );
  }, [txWeHave]);

  return (
    <Container>
      {!isMobile && <Sidebar />}
      <Flex direction="column" grow="1" height="100vh">
        <Flex height="71px">
          <RoomsHeader chatKey={chatKey} />
        </Flex>
        <ChatMessages
          scrollRef={lastMessage}
          messages={messages}
          pendingMessages={pendingMessages.filter((p) => !txWeHave.has(p.txid))}
        />
        <Chatbox
          scrollRef={lastMessage}
          chatKey={chatKey}
          onAddPendingMessage={(pending) =>
            setPendingMessages((msgs) => [...(msgs || []), pending])
          }
        />
      </Flex>
    </Container>
  );
}
