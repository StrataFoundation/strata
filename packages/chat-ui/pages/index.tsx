import React from "react";
import { Stack, Text, Image, Button, useDisclosure } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { route, routes } from "../src/routes";

const Home = () => {
  const router = useRouter();
  const sidebar = useDisclosure();

  return (
    <Layout
      isSidebarOpen={sidebar.isOpen}
      onSidebarClose={sidebar.onClose}
      onSidebarOpen={sidebar.onOpen}
    >
      <Header onSidebarOpen={sidebar.onOpen} />
      <Stack
        px={4}
        direction={{ base: "column", lg: "row" }}
        gap={{ base: 0, lg: 16 }}
        w="full"
        h="full"
        justifyContent="center"
        alignItems="center"
      >
        <Image
          src="./splash.png"
          alt="strata.im splash image"
          w={{ base: "300px", lg: "440px" }}
        />
        <Stack maxW="420px" gap={6}>
          <Stack alignItems={{ base: "center", lg: "start" }}>
            <Text fontSize={{ base: "2xl", lg: "4xl" }} fontWeight="bold">
              Welcome to strata.im
            </Text>
            <Text fontSize={{ base: "md", lg: "lg" }} fontWeight="bold">
              The first gated group chat built on Solana
            </Text>
            <Text fontSize={{ base: "sm", lg: "md" }}>
              Just connect your wallet, and start chatting! All of your messages
              run through the Solana Blockchain and are fully encrypted via Lit
              Protocol. With strata.im, you own your chat experience.
            </Text>
          </Stack>
          <Button
            colorScheme="primary"
            onClick={() =>
              router.push(
                route(routes.chat, {
                  id: "solana",
                }),
                undefined,
                { shallow: true }
              )
            }
          >
            Start Chatting
          </Button>
        </Stack>
      </Stack>
    </Layout>
  );
};

export default Home;
