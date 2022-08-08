import { ManualForm } from "../../../src/components/form/ManualForm";
import { FormContainer } from "../../../src/components/FormContainer";
import { NextPage } from "next";

export const NewFullymanaged: NextPage = () => {
  return (
    <FormContainer title="New Manual Token">
      <ManualForm />
    </FormContainer>
  );
};

export default NewFullymanaged;
