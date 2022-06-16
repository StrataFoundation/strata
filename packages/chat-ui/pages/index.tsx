import React from "react";
import { useMediaQuery } from "@chakra-ui/react";
import { Container } from "@/components/Container";
import { Sidebar } from "@/components/Sidebar";
import { Layout } from "@/components/Layout";

const Home = () => {
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  return <div>test</div>;
};

export default Home;
