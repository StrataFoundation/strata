import {
  Alert,
  Button,
  Input,
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
import { useProvider, useStrataSdks } from "@strata-foundation/react";
import React, { useEffect } from "react";
import { MintInfo, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";

interface ITokenAuthorityFormProps {
  mintAuthority: string;
  freezeAuthority: string;
}

const validationSchema = yup.object({
  mintAuthority: yup.string(),
  freezeAuthority: yup.string(),
});

function mintAuthChanged(mint: MintInfo | undefined, values: ITokenAuthorityFormProps): boolean {
  return !!((mint && mint.mintAuthority && mint.mintAuthority.toString() != values.mintAuthority) || 
    (mint && !mint.mintAuthority && values.mintAuthority != ""));
}

function freezeAuthChanged(mint: MintInfo | undefined, values: ITokenAuthorityFormProps) {
  return !!((mint && mint.freezeAuthority && mint.freezeAuthority.toString() != values.freezeAuthority) || 
    (mint && !mint.freezeAuthority && values.freezeAuthority != ""));
}

function validateAuthorities(mint: MintInfo | undefined, values: ITokenAuthorityFormProps, hasMintAuth: boolean, hasFreezeAuth: boolean) {  
  if (mintAuthChanged(mint, values)) {
    if (!hasMintAuth) {
      return "You need the mint authority to change it";
    }
  } 
  if (freezeAuthChanged(mint, values)) {
    if (!hasFreezeAuth) {
      return "You need the freeze authority to change it";
    }
  }
  if (mintAuthChanged(mint, values) || freezeAuthChanged(mint, values)) return true;
  return "No changes made"
}

export const TokenAuthorityForm = ({
  values,
  metadata,
  mint,
  mintKey,
}: {
  values: DefaultValues<ITokenAuthorityFormProps>;
  metadata: MetadataData | undefined,
  mint: MintInfo | undefined,
  mintKey: PublicKey | undefined,
}) => {
  const { tokenBondingSdk, fungibleEntanglerSdk } = useStrataSdks();
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

  const { connected, publicKey } = useWallet();

  const hasMintAuthority = !!(mint && publicKey && mint.mintAuthority && mint.mintAuthority.equals(publicKey));
  const hasFreezeAuthority = !!(mint && publicKey && mint.freezeAuthority && mint.freezeAuthority.equals(publicKey));
  const hasAnyAuth = hasMintAuthority || hasFreezeAuthority;

  const { execute, loading, error } = useAsyncCallback(
    async (mint: MintInfo | undefined, values: ITokenAuthorityFormProps) => {
    const valid = validateAuthorities(mint, values, hasMintAuthority, hasFreezeAuthority);
    if (typeof(valid) == "string") throw valid;
    
    const instructions = [];
    if (mintAuthChanged(mint, values)) {
      instructions.push(Token.createSetAuthorityInstruction(
        TOKEN_PROGRAM_ID,
        mintKey!,
        new PublicKey(values.mintAuthority),
        "MintTokens",
        publicKey!,
        []
      ))
    }
    if (freezeAuthChanged(mint, values)) {
      instructions.push(Token.createSetAuthorityInstruction(
        TOKEN_PROGRAM_ID,
        mintKey!,
        new PublicKey(values.freezeAuthority),
        "FreezeAccount",
        publicKey!,
        []
      ))
    }
    tokenBondingSdk!.sendInstructions(instructions, []);
  });

  const onSubmit = async (values: ITokenAuthorityFormProps) => {
    await execute(mint, values);
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
            isDisabled={!hasAnyAuth}
            type="submit"
            alignSelf="flex-end"
            colorScheme="primary"
            isLoading={isSubmitting || loading}
            loadingText={awaitingApproval ? "Awaiting Approval" : "Loading"}
          >
            { !hasAnyAuth ? "You do not hold mint or freeze authority" : "Update Authorities" }
          </Button>
        </VStack>
      </form>
    </FormProvider>
  );
};
  