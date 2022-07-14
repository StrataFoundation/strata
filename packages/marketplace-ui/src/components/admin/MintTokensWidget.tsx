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
import { FormControlWithError } from "../form/FormControlWithError";
import { MetadataData } from "@metaplex-foundation/mpl-token-metadata";
import { useAsyncCallback } from "react-async-hook";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProvider } from "@strata-foundation/react";
import React, { useEffect } from "react";



interface IMintTokensWidgetProps {
  mintAuthority: string;
  freezeAuthority: string;
}

const validationSchema = yup.object({
  mintAuthority: yup.string().required(),
  freezeAuthority: yup.string().required(),
});

async function mintTokens() {

}

export const MintTokensWidget = ({
  values,
  mintAuthority,
}: {
  values: DefaultValues<IMintTokensWidgetProps>;
  mintAuthority: PublicKey | null | undefined;
}) => {
  const formProps = useForm<IMintTokensWidgetProps>({
    resolver: yupResolver(validationSchema),
    defaultValues: values,
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = formProps;
  const { awaitingApproval } = useProvider();

  const { execute, loading, error } = useAsyncCallback(mintTokens);

  const { publicKey } = useWallet();

  const hasAuthority = publicKey && mintAuthority && mintAuthority.equals(publicKey);

  const onSubmit = async (values: IMintTokensWidgetProps) => {
    await execute();
  };
  return (
    <FormProvider {...formProps}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
        <VStack spacing={8} w="full">
          <FormControlWithError
            id="number"
            help={`Add new tokens into circulation. There are currently ${100} tokens`}
            errors={errors}
          >
            <Input {...register("mintAuthority")} />
          </FormControlWithError>

          {error && <Alert status="error">{error.toString()}</Alert>}

          <Button
            isDisabled={!hasAuthority}
            type="submit"
            alignSelf="flex-end"
            colorScheme="primary"
            isLoading={isSubmitting || loading}
            loadingText={awaitingApproval ? "Awaiting Approval" : "Loading"}
          >
            { !hasAuthority ? "Your wallet isn't the mint authority" : "Mint" }
          </Button>
        </VStack>
      </form>
    </FormProvider>
  );
};
  