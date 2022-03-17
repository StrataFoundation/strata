import { LbcForm } from "@/components/form/LbcForm";
import { FormContainer } from "@/components/FormContainer";
import { NextPage } from "next";

export const NewBounty: NextPage = () => {
  return (
    <FormContainer title="New LBC">
      <LbcForm />
    </FormContainer>
  );
};

export default NewBounty;
