import { SaleForm } from "@/components/form/SaleForm";
import { FormContainer } from "@/components/FormContainer";
import { NextPage } from "next";

export const NewBounty: NextPage = () => {
  return (
    <FormContainer title="New Sale">
      <SaleForm />
    </FormContainer>
  );
};

export default NewBounty;
