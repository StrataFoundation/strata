import React from 'react';
import { Box, Container, Heading } from "@chakra-ui/react";

export const FormContainer = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) => {
  return (
    <Box w="full" backgroundColor="#f9f9f9" >
      <Container maxW="container.md" pt={8} pb={"200px"}>
        <Heading mb={4} size="lg">
          {title}
        </Heading>
        <Box padding={8} backgroundColor="white" rounded="lg">
          {/* @ts-ignore */}
          {children}
        </Box>
      </Container>
    </Box>
  );
};
