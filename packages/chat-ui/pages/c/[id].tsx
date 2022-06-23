import { Chatbox } from "@/components/Chatbox";
import { ChatMessages } from "@/components/ChatMessages";
import { Header } from "@/components/Header";
import { Layout } from "@/components/Layout";
import { RoomsHeader } from "@/components/rooms/RoomsHeader";
import { Workspace } from "@/components/Workspace";
import { useChatKeyFromIdentifier } from "@/hooks/useChatKeyFromIdentifier";
import { IMessageWithPending, useMessages } from "@/hooks/useMessages";
import { useDisclosure, Flex } from "@chakra-ui/react";
import { useErrorHandler } from "@strata-foundation/react";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useRef, useState } from "react";

export default function Chatroom() {
  const sidebar = useDisclosure();
  const router = useRouter();
  const { id } = router.query;
  const scrollRef = useRef(null);
  const { chatKey } = useChatKeyFromIdentifier(id as string | undefined);
  const [pendingMessages, setPendingMessages] = useState<IMessageWithPending[]>(
    []
  );
  const { messages, error, loadingInitial, loadingMore, hasMore, fetchMore } =
    useMessages(chatKey);
  const { handleErrors } = useErrorHandler();
  handleErrors(error);

  const msgWeHave = useMemo(
    () => new Set(Array.from(messages?.map((message) => message.id) || [])),
    [messages]
  );

  const messagesWithPending = useMemo(
    () =>
      [
        ...(messages || []),
        ...pendingMessages.filter((p) => !msgWeHave.has(p.id)),
      ].sort((a, b) => b.startBlockTime - a.startBlockTime),
    [msgWeHave, messages, pendingMessages]
  );

  useEffect(() => {
    setPendingMessages((pendingMessages) =>
      pendingMessages.filter((p) => !msgWeHave.has(p.id))
    );
  }, [msgWeHave]);

  return (
    <Layout
      isSidebarOpen={sidebar.isOpen}
      onSidebarClose={sidebar.onClose}
      onSidebarOpen={sidebar.onOpen}
    >
      <Header onSidebarOpen={sidebar.onOpen}>
        <RoomsHeader chatKey={chatKey} />
      </Header>
      <Workspace>
        <ChatMessages
          isLoading={loadingInitial || loadingMore}
          scrollRef={scrollRef}
          messages={messagesWithPending}
          hasMore={hasMore}
          fetchMore={fetchMore}
        />
        <Chatbox
          scrollRef={scrollRef}
          chatKey={chatKey}
          onAddPendingMessage={(pending) =>
            setPendingMessages((msgs) => [...(msgs || []), pending])
          }
        />
      </Workspace>
    </Layout>
  );
}
