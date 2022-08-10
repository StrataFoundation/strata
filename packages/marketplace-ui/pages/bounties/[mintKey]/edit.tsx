import { EditBountyForm } from "../../../src/components/form/EditBountyForm";
import { FormContainer } from "../../../src/components/FormContainer";
import { routes, route } from "../../../src/utils/routes";
import { usePublicKey } from "@strata-foundation/react";
import { NextPage } from "next";
import { useRouter } from "next/router";

export const EditBounty: NextPage = () => {
  const router = useRouter();
  const { mintKey: mintKeyRaw } = router.query;
  const mintKey = usePublicKey(mintKeyRaw as string);

  return (
    <FormContainer title="Edit Bounty">
      {mintKey && (
        <EditBountyForm
          mintKey={mintKey}
          onComplete={() => {
            router.push(
              route(routes.bounty, { mintKey: mintKey.toBase58() }),
              undefined,
              { shallow: true }
            );
          }}
        />
      )}
    </FormContainer>
  );
};

export default EditBounty;
