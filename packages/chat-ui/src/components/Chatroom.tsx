import React from "react";
import { ChatboxWithGuards } from "./chatbox/ChatboxWithGuards";
import { ChatMessages } from "./ChatMessages";
import { EmojiPickerPopover } from "./EmojiPicker";
import { FileUploadMask } from "./FileUploadMask";
import { IMessageWithPending, useMessages } from "../hooks/useMessages";
import { Flex } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import {
  randomizeFileName
} from "@strata-foundation/chat";
import {
  useErrorHandler
} from "@strata-foundation/react";
// @ts-ignore
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useAsyncCallback } from "react-async-hook";
import { useDropzone } from "react-dropzone";

const DARK_BG = {
  bg: "gray.900",
};

export function Chatroom({ chatKey }: { chatKey?: PublicKey }) {
  const scrollRef = useRef(null);
  const [pendingMessages, setPendingMessages] = useState<IMessageWithPending[]>(
    []
  );

  const {
    messages,
    error,
    loadingInitial,
    loadingMore,
    hasMore,
    fetchMore,
    fetchNew,
  } = useMessages(chatKey, true, 50);

  const { handleErrors } = useErrorHandler();
  handleErrors(error);

  const { execute: onFocus } = useAsyncCallback(async function () {
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

  const [files, setFiles] = useState<{ name: string; file: File }[]>([]);
  const onUpload = useCallback(
    async (newFiles: File[]) => {
      setFiles((files) => [
        ...files,
        ...[...newFiles].map((file) => {
          const ret = {
            name: file.name,
            file,
          };
          randomizeFileName(file); // so no conflicts with gengo
          return ret;
        }),
      ]);
    },
    [setFiles]
  );
  const { getRootProps, getInputProps, open, isFocused, isDragAccept } =
    useDropzone({
      // Disable click and keydown behavior
      noClick: true,
      noKeyboard: true,
      onDrop: onUpload,
    });
  const rootProps = useMemo(
    () => getRootProps({ className: "dropzone" }),
    [getRootProps]
  );

  useEffect(() => {
    setPendingMessages((pendingMessages) =>
      pendingMessages.filter((p) => !msgWeHave.has(p.id))
    );
  }, [msgWeHave]);

  return (
    <Flex
      position="relative"
      direction="column"
      w="full"
      h="full"
      grow={1}
      bg="white"
      _dark={DARK_BG}
      overflow="hidden"
      {...rootProps}
    >
      {" "}
      {(isFocused || isDragAccept) && <FileUploadMask />}
      <input {...getInputProps()} />
      <EmojiPickerPopover chatKey={chatKey} />
      <ChatMessages
        isLoading={loadingInitial}
        isLoadingMore={loadingMore}
        scrollRef={scrollRef}
        messages={messagesWithPending}
        hasMore={hasMore}
        fetchMore={fetchMore}
      />
      <ChatboxWithGuards
        scrollRef={scrollRef}
        chatKey={chatKey}
        onAddPendingMessage={onAddPendingMessage}
        files={files}
        setFiles={setFiles}
        onUploadFile={open}
      />
    </Flex>
  );
}