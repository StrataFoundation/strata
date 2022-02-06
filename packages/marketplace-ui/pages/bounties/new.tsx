import { BountyForm } from "@/components/form/BountyForm";
import { Box, Container, Heading } from "@chakra-ui/react";
import { NextPage } from "next";

export const NewBounty: NextPage = () => {
  return (
    <Box w="full" backgroundColor="#f9f9f9" height="100vh" overflow="auto">
      <Container maxW="container.md" pt={8} pb={"200px"}>
        <Heading mb={4} size="lg">
          New Bounty
        </Heading>
        <Box padding={8} backgroundColor="white" rounded="lg">
          <BountyForm />
        </Box>
      </Container>
    </Box>
  );
};

export default NewBounty;