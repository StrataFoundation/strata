import { Chatbox } from "@/components/Chatbox";
import { ChatMessages } from "@/components/ChatMessages";
import { EmojiPickerPopover } from "@/components/EmojiPicker";
import { FileUploadMask } from "@/components/FileUploadMask";
import { Header } from "@/components/Header";
import { Layout } from "@/components/Layout";
import { LegacyWalletMigrationModal } from "@/components/LegacyWalletMigrationModal";
import { RoomsHeader } from "@/components/rooms/RoomsHeader";
import { useChatKeyFromIdentifier } from "@/hooks/useChatKeyFromIdentifier";
import { IMessageWithPending, useMessages } from "@/hooks/useMessages";
import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import {
  NAMESPACES_IDL,
  NAMESPACES_PROGRAM,
  NAMESPACES_PROGRAM_ID,
} from "@cardinal/namespaces";
import { Box, Flex, useDisclosure } from "@chakra-ui/react";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { AnchorProvider, Program } from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  ChatIDL,
  ChatIDLJson,
  ChatSdk,
  randomizeFileName,
} from "@strata-foundation/chat";
import {
  getClusterAndEndpoint,
  useErrorHandler,
} from "@strata-foundation/react";
// @ts-ignore
import LitNodeJsSdk from "lit-js-sdk/build/index.node.js";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { NextSeo } from "next-seo";
import { useRouter } from "next/router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAsyncCallback } from "react-async-hook";
import { useDropzone } from "react-dropzone";

const SOLANA_URL =
  process.env.NEXT_PUBLIC_SOLANA_URL || "https://ssc-dao.genesysgo.net/";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { endpoint } = getClusterAndEndpoint(
    (context.query.cluster || SOLANA_URL) as string
  );
  const connection = new Connection(endpoint, {});
  const provider = new AnchorProvider(
    connection,
    new NodeWallet(Keypair.generate()),
    {}
  );
  const apollo = new ApolloClient({
    uri: "https://graph.holaplex.com/v1",
    cache: new InMemoryCache(),
  });

  const chat = new Program<ChatIDL>(
    ChatIDLJson as ChatIDL,
    ChatSdk.ID,
    provider
  ) as Program<ChatIDL>;
  const client = new LitNodeJsSdk.LitNodeClient({
    debug: false,
    alerts: false,
  });
  const namespacesProgram = new Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const chatSdk = new ChatSdk({
    provider,
    program: chat,
    litClient: client,
    namespacesProgram,
  });

  const entryKey = (
    await ChatSdk.entryKey(
      new PublicKey("36u2NChTRLo53UrfEFMV6Pgug6YKbKAmw3M4Mi1JfFdn"),
      context.params?.id as string
    )
  )[0];
  const entryAcc = (await connection.getAccountInfo(entryKey))!;
  const entry = await chatSdk.entryDecoder(entryKey, entryAcc);

  const address = (await Metadata.getPDA(entry.mint)).toBase58();
  const result = await apollo.query<{
    nft: { name: string; description: string; image: string };
  }>({
    query: gql`
      query GetUrl($address: String!) {
        nft(address: $address) {
          name
          description
          image
        }
      }
    `,
    variables: {
      address,
    },
  });

  const { name, description, image } = result.data?.nft || {};

  return {
    props: {
      name: name || null,
      description: description || null,
      image: image || null,
    },
  };
};

const DARK_BG = {
  bg: "gray.900",
};

export default function Chatroom({
  name,
  image,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const sidebar = useDisclosure();
  const router = useRouter();
  const { id } = router.query;
  const scrollRef = useRef(null);
  const { chatKey } = useChatKeyFromIdentifier(id as string | undefined);
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
    <Layout
      isSidebarOpen={sidebar.isOpen}
      onSidebarClose={sidebar.onClose}
      onSidebarOpen={sidebar.onOpen}
    >
      <NextSeo
        title={name}
        description={`${name} - A decentralized chatroom powered by Strata Protocol on Solana`}
        openGraph={{
          url: `chat.strataprotocol.com/c/${id as string}`,
          title: name,
          description: `${name} - A decentralized chatroom powered by Strata Protocol on Solana`,
          images: [{ url: image }],
          site_name: "StrataChat",
        }}
        twitter={{
          handle: "@StrataProtocol",
          site: "http://chat.strataprotocol.com",
          cardType: "summary",
        }}
      />
      <LegacyWalletMigrationModal />
      <Header onSidebarOpen={sidebar.onOpen}>
        <RoomsHeader chatKey={chatKey} />
      </Header>

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
        <Chatbox
          scrollRef={scrollRef}
          chatKey={chatKey}
          onAddPendingMessage={onAddPendingMessage}
          files={files}
          setFiles={setFiles}
          onUploadFile={open}
        />
      </Flex>
      {/* </Flex> */}
    </Layout>
  );
}
