import React from "react";
import { useDisclosure } from "@chakra-ui/react";
import { Layout } from "@/components/Layout";
import { Header } from "@/components/Header";

const Home = () => {
  const sidebar = useDisclosure();

  return (
    <Layout
      isSidebarOpen={sidebar.isOpen}
      onSidebarClose={sidebar.onClose}
      onSidebarOpen={sidebar.onOpen}
    >
      <Header onSidebarOpen={sidebar.onOpen} />
    </Layout>
  );
};

export default Home;
