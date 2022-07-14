import {
  Alert,
  Box,
  Image,
  Button,
  Container,
  Center,
  Stack,
  Text,
  Collapse,
  Flex,
  Input,
  Switch,
  VStack,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { DefaultValues, FormProvider, useForm } from "react-hook-form";
import { PublicKey } from "@solana/web3.js";
import { FormControlWithError } from "./FormControlWithError";
import { MetadataData } from "@metaplex-foundation/mpl-token-metadata";
import { useAsyncCallback } from "react-async-hook";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProvider } from "@strata-foundation/react";
import React, { useEffect } from "react";
import { MintInfo } from "@solana/spl-token";

interface ITokenAuthorityFormProps {
  mintAuthority: string;
  freezeAuthority: string;
}

const validationSchema = yup.object({
  mintAuthority: yup.string().required(),
  freezeAuthority: yup.string().required(),
});

async function editAuthorities() {

}

export const TokenAuthorityForm = ({
  values,
  metadata,
  mint,
}: {
  values: DefaultValues<ITokenAuthorityFormProps>;
  metadata: MetadataData | undefined,
  mint: MintInfo | undefined,
}) => {
  const formProps = useForm<ITokenAuthorityFormProps>({
    resolver: yupResolver(validationSchema),
    defaultValues: values,
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = formProps;
  const { awaitingApproval } = useProvider();

  useEffect(() => {
    setValue("mintAuthority", mint?.mintAuthority?.toString() || "");
    setValue("freezeAuthority", mint?.freezeAuthority?.toString() || "");
  }, [setValue, mint]);

  const { execute, loading, error } = useAsyncCallback(editAuthorities);

  const { connected, publicKey } = useWallet();

  const insufficientAuthority = metadata?.updateAuthority
    ? metadata.updateAuthority != publicKey?.toBase58()
    : false;

  const onSubmit = async (values: ITokenAuthorityFormProps) => {
    await execute();
  };
  return (
    <FormProvider {...formProps}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
        <VStack spacing={8} w="full">
          <FormControlWithError
            id="mintAuthority"
            label="Mint Authority"
            errors={errors}
          >
            <Input {...register("mintAuthority")} />
          </FormControlWithError>
          <FormControlWithError
            id="freezeAuthority"
            label="Freeze Authority"
            errors={errors}
          >
            <Input {...register("freezeAuthority")} />
          </FormControlWithError>

          {error && <Alert status="error">{error.toString()}</Alert>}

          <Button
            isDisabled={insufficientAuthority}
            type="submit"
            alignSelf="flex-end"
            colorScheme="primary"
            isLoading={isSubmitting || loading}
            loadingText={awaitingApproval ? "Awaiting Approval" : "Loading"}
          >
            { insufficientAuthority ? "You do not hold the update authority" : metadata ? "Update Metadata" : "Create Metadata" }
          </Button>
        </VStack>
      </form>
    </FormProvider>
  );
};
  