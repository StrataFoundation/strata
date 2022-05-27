import React from "react";
import { useMediaQuery } from "@chakra-ui/react";
import { Container } from "@/components/Container";
import { Sidebar } from "@/components/Sidebar";

const Home = () => {
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  return (
    <Container alignItems="flex-start" height="100vh">
      <Sidebar fullWidth={isMobile} />
    </Container>
  );
};

export default Home;
