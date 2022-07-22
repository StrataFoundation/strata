import { Chatroom } from "@/components/Chatroom";
import { Header } from "@/components/Header";
import { Layout } from "@/components/Layout";
import { LegacyWalletMigrationModal } from "@/components/LegacyWalletMigrationModal";
import { RoomsHeader } from "@/components/rooms/RoomsHeader";
import { SendMessageProvider } from "@/contexts/sendMessage";
import { useChatKeyFromIdentifier } from "@/hooks/useChatKeyFromIdentifier";
import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import {
  NAMESPACES_IDL,
  NAMESPACES_PROGRAM,
  NAMESPACES_PROGRAM_ID,
} from "@cardinal/namespaces";
import { useDisclosure } from "@chakra-ui/react";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { AnchorProvider, Program } from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { ChatIDL, ChatIDLJson, ChatSdk } from "@strata-foundation/chat";
import { getClusterAndEndpoint, usePublicKey } from "@strata-foundation/react";
// @ts-ignore
import LitNodeJsSdk from "lit-js-sdk/build/index.node.js";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { NextSeo } from "next-seo";
import { useRouter } from "next/router";

const SOLANA_URL =
  process.env.NEXT_PUBLIC_SOLANA_URL || "https://ssc-dao.genesysgo.net/";

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
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
  } catch (e: any) {
    console.error(e);
    return {
      props: {
        name: null,
        description: null,
        image: null,
      },
    };
  }
};

export default function ChatroomPage({
  name,
  image,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const sidebar = useDisclosure();
  const router = useRouter();
  const { id } = router.query;
  const { chatKey } = useChatKeyFromIdentifier(id as string | undefined);
  const pubkeyChatKey = usePublicKey(id as string);

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
      <SendMessageProvider chatKey={chatKey || pubkeyChatKey}>
        <Header onSidebarOpen={sidebar.onOpen}>
          <RoomsHeader chatKey={chatKey || pubkeyChatKey} />
        </Header>
        <Chatroom chatKey={chatKey || pubkeyChatKey} />
      </SendMessageProvider>
    </Layout>
  );
}
