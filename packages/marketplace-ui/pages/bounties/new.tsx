import { BountyForm } from "@/components/form/BountyForm";
import { FormContainer } from "@/components/FormContainer";
import { NextPage } from "next";

export const NewBounty: NextPage = () => {
  return (
    <FormContainer title="New Bounty">
      <BountyForm />
    </FormContainer>
  );
};

export default NewBounty;
