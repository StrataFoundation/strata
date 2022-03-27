import { FullyManagedForm } from "@/components/form/FullyManagedForm";
import { FormContainer } from "@/components/FormContainer";
import { NextPage } from "next";

export const NewFullymanaged: NextPage = () => {
  return (
    <FormContainer title="New Fully Managed Token">
      <FullyManagedForm />
    </FormContainer>
  );
};

export default NewFullymanaged;
