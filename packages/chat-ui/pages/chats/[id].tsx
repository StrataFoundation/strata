import { Flex, useMediaQuery } from "@chakra-ui/react";
import React, { useRef } from "react";
import { ChatMessages } from "@/components/ChatMessages";
import { Chatbox } from "@/components/Chatbox";
import { Sidebar } from "@/components/Sidebar";
import { Container } from "@/components/Container";
import { useRouter } from "next/router";
import { RoomsHeader } from "@/components/rooms/RoomsHeader";
import { useChatKey } from "@/hooks/useChatKey";

export default function Chatroom() {
  const [isMobile] = useMediaQuery('(max-width: 768px)')
  const router = useRouter()
  const { id } = router.query
  const lastMessage = useRef(null)
  const chatKey = useChatKey(id as string | undefined);

  return (
    <Container>
      {!isMobile && <Sidebar />}
      <Flex
        direction="column"
        grow="1"
        height="100vh"
      >
        <Flex height="71px">
          <RoomsHeader chatKey={chatKey} />
        </Flex>
        <ChatMessages scrollRef={lastMessage} chatKey={chatKey} />
        <Chatbox scrollRef={lastMessage} chatKey={chatKey} />
      </Flex>
    </Container>
  )
}
