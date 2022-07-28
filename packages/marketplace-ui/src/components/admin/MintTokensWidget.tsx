import {
  Alert,
  Box,
  Button,
  Text,
  Input,
  VStack,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { DefaultValues, FormProvider, useForm } from "react-hook-form";
import { PublicKey } from "@solana/web3.js";
import { FormControlWithError } from "../form/FormControlWithError";
import { useAsyncCallback } from "react-async-hook";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProvider } from "@strata-foundation/react";
import React from "react";
import { createAtaAndMint } from "@strata-foundation/spl-utils"; 
import { MintInfo } from "@solana/spl-token";
import { useMemo } from "react";

interface IMintTokensWidgetProps {
  number: string;
}

const validationSchema = yup.object({
  number: yup.number().typeError("Must be a number").required().positive(),
});

function round(num: number, decimals: number) {
  //@ts-ignore
  return +(Math.round(num + "e+" + decimals)  + "e-" + decimals);
}

export const MintTokensWidget = ({
  values,
  mint,
  mintKey,
}: {
  values: DefaultValues<IMintTokensWidgetProps>;
  mint: MintInfo | undefined;
  mintKey: PublicKey | undefined;
}) => {
  const formProps = useForm<IMintTokensWidgetProps>({
    resolver: yupResolver(validationSchema),
    defaultValues: values,
  });
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = formProps;
  const { provider, awaitingApproval } = useProvider();
  const { publicKey } = useWallet();

  const { execute, loading, error } = useAsyncCallback(async (values: IMintTokensWidgetProps) => {
    await createAtaAndMint(provider!, mintKey!, Number(values.number) * Math.pow(10, mint!.decimals), publicKey!)
  });

  const hasAuthority = publicKey && mint && mint.mintAuthority && mint.mintAuthority.equals(publicKey);

  const supply = useMemo(() => {
    return mint ? Number(mint.supply) / Math.pow(10, mint.decimals) : 0;
  }, [mint])

  const onSubmit = async (values: IMintTokensWidgetProps) => {
    await execute(values);
  };

  const toMintNum = watch("number", "0");
  return (
    <Box bgColor="white" borderRadius="8px" w="full">
      <Box padding="20px">
        <Text fontSize="xl" color="black.500" fontWeight="bold" paddingBottom="10px">Mint Tokens</Text>
        <FormProvider {...formProps}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
            <VStack spacing={8} w="full">
              <FormControlWithError
                id="number"
                help={`Add new tokens into circulation. There are currently ${supply} tokens`}
                errors={errors}
              >
                <Input {...register("number")} />
              </FormControlWithError>
              <Text 
                color="gray.500" 
                fontSize="sm" 
                alignSelf="flex-start" 
                marginTop="0.5em !important" 
                fontWeight="bold"
              >
                New Token Amount: {Number(toMintNum) ? round(supply + Number(toMintNum), mint!.decimals) : supply}
              </Text>

              {error && <Alert status="error">{error.toString()}</Alert>}

              <Button
                isDisabled={!hasAuthority}
                type="submit"
                alignSelf="flex-end"
                colorScheme="primary"
                isLoading={isSubmitting || loading}
                loadingText={awaitingApproval ? "Awaiting Approval" : "Loading"}
              >
                { !hasAuthority ? "Not mint authority" : "Mint" }
              </Button>
            </VStack>
          </form>
        </FormProvider>
      </Box>
    </Box>
  );
};
  