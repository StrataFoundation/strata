import { BountyForm } from "@/components/form/BountyForm";
import { Container } from "@chakra-ui/react";
import { NextPage } from "next";

export const NewBounty: NextPage = () => {
  return <Container mt={8}>
    <BountyForm />
  </Container>
}

export default NewBounty;