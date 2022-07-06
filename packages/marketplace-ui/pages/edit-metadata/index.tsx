import { EditMetadataForm } from "@/components/form/EditMetadataForm";
import { FormContainer } from "@/components/FormContainer";
import { route, routes } from "@/utils/routes";
import { NextPage } from "next";
import { useRouter } from "next/router";

export const EditMetadata: NextPage = () => {
  const router = useRouter();
  return (
    <FormContainer title="Edit Metadata">
      <EditMetadataForm
        values={{}}
        onComplete={(mintKey) => {
          router.push(
            route(routes.sell, { mint: mintKey.toBase58() }),
            undefined,
            { shallow: true }
          );
        }}
      />
    </FormContainer>
  );
};

export default EditMetadata;
