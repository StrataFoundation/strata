import { FormContainer } from "../../../src/components/FormContainer";
import { NextPage } from "next";
import { LbcForm } from "../../../src/components/form/LbcForm";

export const NewLBC: NextPage = () => {
  return (
    <FormContainer title="New LBC">
      <LbcForm />
    </FormContainer>
  );
};

export default NewLBC;
