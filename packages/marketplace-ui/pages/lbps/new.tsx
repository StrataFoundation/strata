import { LbpForm } from "@/components/form/LbpForm";
import { FormContainer } from "@/components/FormContainer";
import { NextPage } from "next";

export const NewBounty: NextPage = () => {
  return (
    <FormContainer title="New LBP">
      <LbpForm />
    </FormContainer>
  );
};

export default NewBounty;
