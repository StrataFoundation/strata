import { Flex, useMediaQuery } from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { ChatMessages } from "@/components/ChatMessages";
import { Chatbox, IPendingMessage } from "@/components/Chatbox";
import { Sidebar } from "@/components/Sidebar";
import { Container } from "@/components/Container";
import { useRouter } from "next/router";
import { RoomsHeader } from "@/components/rooms/RoomsHeader";
import { useChatKey } from "@/hooks/useChatKey";
import { useMessages } from "@/hooks/useMessages";

export default function Chatroom() {
  const [isMobile] = useMediaQuery('(max-width: 768px)')
  const router = useRouter()
  const { id } = router.query
  const lastMessage = useRef(null)
  const chatKey = useChatKey(id as string | undefined);
  const [pendingMessages, setPendingMessages] = useState<IPendingMessage[]>();
  const { messages } = useMessages(chatKey);

  useEffect(() => {
    if (messages) {
      const txWeHave = new Set(Array.from(messages?.map(message => message.txid)))
      setPendingMessages(pendingMessages => pendingMessages?.filter(p => !txWeHave.has(p.txid)))
    }
  }, [messages, pendingMessages])

  return (
    <Container>
      {!isMobile && <Sidebar />}
      <Flex direction="column" grow="1" height="100vh">
        <Flex height="71px">
          <RoomsHeader chatKey={chatKey} />
        </Flex>
        <ChatMessages scrollRef={lastMessage} messages={messages?.reverse()} pendingMessages={pendingMessages} />
        <Chatbox
          scrollRef={lastMessage}
          chatKey={chatKey}
          onAddPendingMessage={(pending) =>
            setPendingMessages((msgs) => msgs && [...msgs, pending])
          }
        />
      </Flex>
    </Container>
  );
}
