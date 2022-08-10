import React from "react";
import { Chatroom } from "../../src/components/Chatroom";
import { Header } from "../../src/components/Header";
import { Layout } from "../../src/components/Layout";
import { LegacyWalletMigrationModal } from "../../src/components/LegacyWalletMigrationModal";
import { RoomsHeader } from "../../src/components/rooms/RoomsHeader";
import { SendMessageProvider } from "../../src/contexts/sendMessage";
import { useChatKeyFromIdentifier } from "../../src/hooks/useChatKeyFromIdentifier";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import {
  NAMESPACES_IDL,
  NAMESPACES_PROGRAM,
  NAMESPACES_PROGRAM_ID,
} from "@cardinal/namespaces";
import { useDisclosure } from "@chakra-ui/react";
import { AnchorProvider, Program } from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { ChatSdk, IEntry } from "@strata-foundation/chat";
import { getClusterAndEndpoint, TokenListProvider, usePublicKey } from "@strata-foundation/react";
// @ts-ignore
import LitNodeJsSdk from "lit-js-sdk/build/index.node.js";
import {
  GetServerSideProps,
  GetStaticProps,
  InferGetServerSidePropsType,
  InferGetStaticPropsType,
} from "next";
import { NextSeo } from "next-seo";
import { useRouter } from "next/router";
import { useMemo } from "react";

export async function getStaticPaths() {
  return {
    paths: [{ params: { id: "solana" } }, { params: { id: "open" } }],
    fallback: true,
  };
}

const SOLANA_URL =
  process.env.NEXT_PUBLIC_SOLANA_URL || "https://ssc-dao.genesysgo.net/";

const QUICK_PROPS: Record<string, any> = {
  solana: {
    name: "solana.chat",
    description:
      "solana.chat - A decentralized chatroom powered by Strata Protocol on Solana",
    image:
      "https://nft.cardinal.so/img/9497kTCD3ct7JaRTzCzQvS5N5iwbzxaK8Sci6gDZTq8C?name=solana",
    chatKey: "EzNMGtFA62nvDfCybZi4vhfeJUoMJyMijcKoC8heoyHK",
  },
  open: {
    name: "open.chat",
    description:
      "open.chat - A decentralized chatroom powered by Strata Protocol on Solana",
    image:
      "https://nft.cardinal.so/img/5tjEoagtGJrMoywNHg5UXqXyVxkcfZr78Zeu7RmaCuDJ?name=open",
    chatKey: "HN8GF8nKHLnymPUwn4cfNmtSwAcErRweDDDGzyhj6wKH",
  },
};

export const getStaticProps: GetStaticProps = async (context) => {
  try {
    const quickProps = QUICK_PROPS[(context.params?.id || "") as string];
    if (quickProps) {
      // Valid for a week
      // context.res.setHeader(
      //   "Cache-Control",
      //   "public, s-maxage=604800, stale-while-revalidate=59"
      // );

      return {
        props: quickProps,
      };
    }

    const { endpoint } = getClusterAndEndpoint(SOLANA_URL as string);
    const connection = new Connection(endpoint, {
      commitment: "confirmed",
    });
    const provider = new AnchorProvider(
      connection,
      new NodeWallet(Keypair.generate()),
      {}
    );
    const namespacesProgram = new Program<NAMESPACES_PROGRAM>(
      NAMESPACES_IDL,
      NAMESPACES_PROGRAM_ID,
      provider
    );

    const entryKey = (
      await ChatSdk.entryKey(
        new PublicKey("36u2NChTRLo53UrfEFMV6Pgug6YKbKAmw3M4Mi1JfFdn"),
        context.params?.id as string
      )
    )[0];
    const entryAcc = (await connection.getAccountInfo(entryKey))!;
    const entry =
      entryAcc &&
      (await namespacesProgram.coder.accounts.decode<IEntry>(
        "entry",
        entryAcc.data
      ));

    // // Valid for a week
    // context.res.setHeader(
    //   "Cache-Control",
    //   "public, s-maxage=604800, stale-while-revalidate=59"
    // );

    return {
      props: {
        name: context.params?.id || null + ".chat",
        description: `${context.params?.id}.chat - A decentralized chatroom powered by Strata Protocol on Solana`,
        image: `https://nft.cardinal.so/img/${entry?.mint.toBase58()}?name=${
          context.params?.id
        }`,
        chatKey: entry && (await ChatSdk.chatKey(entry.mint))[0].toBase58(),
      },
    };
  } catch (e: any) {
    console.error(e);
    return {
      props: {
        name: null,
        description: null,
        image: null,
        chatKey: null,
      },
    };
  }
};

export default function ChatroomPage({
  name,
  image,
  description,
  chatKey: chatKeyStr,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const sidebar = useDisclosure();
  const router = useRouter();
  const { id } = router.query;
  const { chatKey: chatKeyFromQuery } = useChatKeyFromIdentifier(
    id as string | undefined
  );
  const chatKeyFromStatic = usePublicKey(chatKeyStr);
  const chatKey = useMemo(
    () => chatKeyFromQuery || chatKeyFromStatic,
    [chatKeyFromQuery, chatKeyFromStatic]
  );

  return (
    <Layout
      isSidebarOpen={sidebar.isOpen}
      onSidebarClose={sidebar.onClose}
      onSidebarOpen={sidebar.onOpen}
    >
      <NextSeo
        title={name}
        description={description}
        openGraph={{
          url: `chat.strataprotocol.com/c/${id as string}`,
          title: `strata.im - ${name}`,
          description: description,
          images: [{ url: image }],
          site_name: "strata.im",
        }}
        twitter={{
          handle: "@StrataProtocol",
          site: "http://chat.strataprotocol.com",
          cardType: "summary",
        }}
      />
      <TokenListProvider>
        <SendMessageProvider chatKey={chatKey}>
          <Header onSidebarOpen={sidebar.onOpen}>
            <RoomsHeader chatKey={chatKey} />
          </Header>
          <Chatroom chatKey={chatKey} />
        </SendMessageProvider>
      </TokenListProvider>
      <LegacyWalletMigrationModal />
    </Layout>
  );
}
