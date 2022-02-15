import { LiquidityBootstrapperForm } from "@/components/form/LiqduitiyBootstrapperForm";
import { FormContainer } from "@/components/FormContainer";
import { NextPage } from "next";

export const NewBounty: NextPage = () => {
  return (
    <FormContainer title="New Liquidity Bootstrapper">
      <LiquidityBootstrapperForm />
    </FormContainer>
  );
};

export default NewBounty;
