import { NFT_STORAGE_API_KEY } from "../../constants";
import { Alert, Button, Input, Switch, VStack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { DataV2 } from "@metaplex-foundation/mpl-token-metadata";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from "@solana/spl-token";
import { Keypair, PublicKey, Signer } from "@solana/web3.js";
import { useProvider, useStrataSdks } from "@strata-foundation/react";
import {
  createMintInstructions,
  sendInstructions,
  SplTokenMetadata,
} from "@strata-foundation/spl-utils";
import { useRouter } from "next/router";
import React from "react";
import { useAsyncCallback } from "react-async-hook";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { route, routes } from "../../utils/routes";
import { FormControlWithError } from "./FormControlWithError";
import { IMetadataFormProps, TokenMetadataInputs } from "./TokenMetadataInputs";

interface IManualForm extends IMetadataFormProps {
  symbol: string;
  supply: number;
  decimals: number;
  keepMintAuthority: boolean;
  keepFreezeAuthority: boolean;
}

const validationSchema = yup.object({
  image: yup.mixed(),
  name: yup.string().required().min(2),
  description: yup.string().required().min(2),
  symbol: yup.string().required().min(2),
  supply: yup.number().required().min(0),
  keepMintAuthority: yup.boolean(),
  keepFreezeAuthority: yup.boolean(),
});

async function createFullyManaged(
  tokenMetadataSdk: SplTokenMetadata,
  values: IManualForm,
  nftStorageApiKey: string | undefined = NFT_STORAGE_API_KEY
): Promise<PublicKey> {
  const targetMintKeypair = Keypair.generate();
  const targetMint = targetMintKeypair.publicKey;
  const me = tokenMetadataSdk.provider.wallet.publicKey;
  const instructions = await createMintInstructions(
    tokenMetadataSdk.provider,
    me,
    targetMintKeypair.publicKey,
    values.decimals,
    values.keepFreezeAuthority ? me : undefined
  );
  const signers: Signer[] = [targetMintKeypair];
  const uri = await tokenMetadataSdk.uploadMetadata({
    provider: values.provider,
    name: values.name,
    symbol: values.symbol,
    description: values.description,
    image: values.image,
    mint: targetMintKeypair.publicKey,
    nftStorageApiKey,
  });
  const metadata = new DataV2({
    // Max name len 32
    name: values.name.substring(0, 32),
    symbol: values.symbol.substring(0, 10),
    uri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  });
  const {
    instructions: metadataInstructions,
    signers: metadataSigners,
    output,
  } = await tokenMetadataSdk.createMetadataInstructions({
    data: metadata,
    mint: targetMint,
    mintAuthority: me,
    authority: me,
  });
  instructions.push(...metadataInstructions);
  signers.push(...metadataSigners);
  const ata = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    targetMint,
    me,
    true
  );
  instructions.push(
    Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      targetMint,
      ata,
      me,
      me
    ),
    Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      targetMint,
      ata,
      me,
      [],
      new u64(values.supply * Math.pow(10, values.decimals))
    )
  );

  if (!values.keepMintAuthority) {
    instructions.push(
      Token.createSetAuthorityInstruction(
        TOKEN_PROGRAM_ID,
        targetMint,
        null,
        "MintTokens",
        me,
        []
      )
    );
  }

  await sendInstructions(
    new Map(),
    tokenMetadataSdk.provider,
    instructions,
    signers,
    me
  );

  return targetMintKeypair.publicKey;
}

export const ManualForm: React.FC<{
  nftStorageApiKey?: string;
}> = ({ nftStorageApiKey = NFT_STORAGE_API_KEY }) => {
  const formProps = useForm<IManualForm>({
    resolver: yupResolver(validationSchema),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = formProps;
  const { awaitingApproval } = useProvider();
  const { execute, loading, error } = useAsyncCallback(createFullyManaged);
  const { tokenMetadataSdk } = useStrataSdks();
  const router = useRouter();

  const onSubmit = async (values: IManualForm) => {
    const mintKey = await execute(tokenMetadataSdk!, values);
    router.push(routes.sell.path + "?mint=" + mintKey.toBase58());
  };

  return (
    <FormProvider {...formProps}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={8}>
          <TokenMetadataInputs entityName="token" />
          <FormControlWithError
            id="symbol"
            help="The symbol for this token, ex: SOL"
            label="Symbol"
            errors={errors}
          >
            <Input {...register("symbol")} />
          </FormControlWithError>
          <FormControlWithError
            id="decimals"
            help="The number of of decimal places this mint will have. For example, SOL has 9 decimal places of precision"
            label="Decimals"
            errors={errors}
          >
            <Input
              type="number"
              min={0}
              max={12}
              step={1}
              {...register("decimals")}
            />
          </FormControlWithError>
          <FormControlWithError
            id="supply"
            help="The number of tokens to mint. After creation these will be available in your wallet"
            label="Supply"
            errors={errors}
          >
            <Input
              type="number"
              min={0}
              step={0.0000000001}
              {...register("supply")}
            />
          </FormControlWithError>
          <FormControlWithError
            id="keepMintAuthority"
            help={`Would you like the ability to mint more than the specified supply of tokens?`}
            label="Keep Mint Authority?"
            errors={errors}
          >
            <Switch {...register("keepMintAuthority")} />
          </FormControlWithError>
          <FormControlWithError
            id="keepFreezeAuthority"
            help={`Would you like the ability to freeze token accounts using this token, so that they may no longer be used.`}
            label="Keep Freeze Authority?"
            errors={errors}
          >
            <Switch {...register("keepFreezeAuthority")} />
          </FormControlWithError>

          {error && (
            <Alert status="error">
              <Alert status="error">{error.toString()}</Alert>
            </Alert>
          )}

          <Button
            type="submit"
            alignSelf="flex-end"
            colorScheme="primary"
            isLoading={isSubmitting || loading}
            loadingText={awaitingApproval ? "Awaiting Approval" : "Loading"}
          >
            Create Token
          </Button>
        </VStack>
      </form>
    </FormProvider>
  );
};
