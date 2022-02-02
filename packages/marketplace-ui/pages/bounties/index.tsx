import { Box, VStack, HStack, Button, Container, Link } from "@chakra-ui/react";
import { NextPage } from "next";
import Head from "next/head";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { routes } from "../routes";

export const Bounties: NextPage = () => {
  return (
    <Container h="100vh" justify="stretch">
      <Head>
        <title>Strata Bounties</title>
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="og:type" content="website" />
        <meta
          name="description"
          content="Bounties allow users to pool resources to get work done"
        />
        <meta property="og:title" content="Strata Bounty Board" />
        {/* <meta property="og:image" content={} /> */}
        {/* <meta property="og:description" content={description} /> */}
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <VStack pt={4} align="stretch" justify="stretch">
        <HStack justify="end">
          <Button
            as={Link}
            href={routes.newBounty.path}
            leftIcon={<AiOutlinePlusCircle />}
            colorScheme="green"
            variant="outline"
          >
            Create
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
}

export default Bounties;