import { FormContainer } from "@/components/FormContainer";
import { NextPage } from "next";
import { LbcForm } from "@/components/form/LbcForm";

export const NewLBC: NextPage = () => {
  return (
    <FormContainer title="New LBC">
      <LbcForm />
    </FormContainer>
  );
};

export default NewLBC;
