import { BountyForm } from "@/components/form/BountyForm";
import { FormContainer } from "@/components/FormContainer";
import { routes, route } from "@/utils/routes";
import { NextPage } from "next";
import { useRouter } from "next/router";

export const NewBounty: NextPage = () => {
  const router = useRouter();
  return (
    <FormContainer title="New Bounty">
      <BountyForm
        onComplete={(mintKey) => {
          router.push(
            route(routes.bounty, { mintKey: mintKey.toBase58() }),
            undefined,
            { shallow: true }
          );
        }}
      />
    </FormContainer>
  );
};

export default NewBounty;
