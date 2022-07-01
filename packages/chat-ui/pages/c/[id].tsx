import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDisclosure, Flex } from "@chakra-ui/react";
import { useErrorHandler } from "@strata-foundation/react";
import { useRouter } from "next/router";
import { Chatbox } from "@/components/Chatbox";
import { ChatMessages } from "@/components/ChatMessages";
import { Header } from "@/components/Header";
import { Layout } from "@/components/Layout";
import { LegacyWalletMigrationModal } from "@/components/LegacyWalletMigrationModal";
import { RoomsHeader } from "@/components/rooms/RoomsHeader";
import { Workspace } from "@/components/Workspace";
import { EmojiPickerPopover } from "@/components/EmojiPicker";
import { useChatKeyFromIdentifier } from "@/hooks/useChatKeyFromIdentifier";
import { IMessageWithPending, useMessages } from "@/hooks/useMessages";
import { useAsyncCallback } from "react-async-hook";

export default function Chatroom() {
  const sidebar = useDisclosure();
  const router = useRouter();
  const { id } = router.query;
  const scrollRef = useRef(null);
  const { chatKey } = useChatKeyFromIdentifier(id as string | undefined);
  const [pendingMessages, setPendingMessages] = useState<IMessageWithPending[]>(
    []
  );

  const { messages, error, loadingInitial, loadingMore, hasMore, fetchMore, fetchNew } =
    useMessages(chatKey);

  const { handleErrors } = useErrorHandler();
  handleErrors(error);

  const { execute: onFocus } = useAsyncCallback(async function() {
    let oldCount = messages!.length;
    while (true) {
      await fetchNew(50);
      let newCount = messages!.length;
      if (newCount - oldCount < 50) break;
    }
  });

  useEffect(() => {
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const msgWeHave = useMemo(
    () => new Set(Array.from(messages?.map((message) => message.id) || [])),
    [messages]
  );

  const onAddPendingMessage = useCallback(
    (pending: IMessageWithPending) =>
      setPendingMessages((msgs) => [...(msgs || []), pending]),
    [setPendingMessages]
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
      <LegacyWalletMigrationModal />
      <Header onSidebarOpen={sidebar.onOpen}>
        <RoomsHeader chatKey={chatKey} />
      </Header>
      <Workspace>
        <EmojiPickerPopover chatKey={chatKey} />
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
          onAddPendingMessage={onAddPendingMessage}
        />
      </Workspace>
    </Layout>
  );
}
