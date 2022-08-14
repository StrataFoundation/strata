import { FixedPriceForm } from "../../../src/components/form/FixedPriceForm";
import { FormContainer } from "../../../src/components/FormContainer";
import { NextPage } from "next";

export const NewSale: NextPage = () => {
  return (
    <FormContainer title="New Sale">
      <FixedPriceForm />
    </FormContainer>
  );
};

export default NewSale;
