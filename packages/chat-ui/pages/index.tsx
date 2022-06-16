import React from "react";
import { useDisclosure } from "@chakra-ui/react";
import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";
import { Workspace } from "@/components/Workspace";

const Home = () => {
  const sidebar = useDisclosure();

  return (
    <Layout
      isSidebarOpen={sidebar.isOpen}
      onSidebarClose={sidebar.onClose}
      onSidebarOpen={sidebar.onOpen}
    >
      <Header onSidebarOpen={sidebar.onOpen} />
      <Workspace />
    </Layout>
  );
};

export default Home;
