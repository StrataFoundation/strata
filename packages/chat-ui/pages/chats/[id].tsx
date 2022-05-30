import { Flex, useMediaQuery } from "@chakra-ui/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChatMessages } from "@/components/ChatMessages";
import { Chatbox, IPendingMessage } from "@/components/Chatbox";
import { Sidebar } from "@/components/Sidebar";
import { Container } from "@/components/Container";
import { useRouter } from "next/router";
import { RoomsHeader } from "@/components/rooms/RoomsHeader";
import { useChatKey } from "@/hooks/useChatKey";
import { useMessages } from "@/hooks/useMessages";
import { useErrorHandler } from "@strata-foundation/react";

export default function Chatroom() {
  const [isMobile] = useMediaQuery('(max-width: 768px)')
  const router = useRouter()
  const { id } = router.query
  const lastMessage = useRef(null)
  const chatKey = useChatKey(id as string | undefined);
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
