import {
  Alert,
  Button, Flex,
  Input, Text, VStack
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { DataV2, Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import {
  useProvider,
  usePublicKey,
  useStrataSdks,
  useTokenMetadata
} from "@strata-foundation/react";
import { SplTokenMetadata } from "@strata-foundation/spl-utils";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useAsyncCallback } from "react-async-hook";
import { DefaultValues, FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { FormControlWithError } from "./FormControlWithError";
import { MintSelect } from "./MintSelect";
import { IMetadataFormProps, TokenMetadataInputs } from "./TokenMetadataInputs";

interface IEditMetadataFormProps extends IMetadataFormProps {
  symbol: string;
  mint: string;
}

const validationSchema = yup.object({
  mint: yup.string().required(),
  image: yup.mixed(),
  name: yup.string().required().min(2),
  description: yup.string(),
  symbol: yup.string().min(2).max(10),
});

async function editMetadata(
  tokenMetadataSdk: SplTokenMetadata,
  values: IEditMetadataFormProps,
): Promise<PublicKey> {
  const mintKey = new PublicKey(values.mint);
  const uri = await tokenMetadataSdk.uploadMetadata({
    provider: values.provider,
    name: values.name,
    symbol: values.symbol,
    description: values.description,
    image: values.image,
    mint: mintKey,
  });

  const instructions = [];
  const signers = [];
  const metadata = await Metadata.getPDA(mintKey);
  const data = new DataV2({
    // Max name len 32
    name: values.name.substring(0, 32),
    symbol: values.symbol.substring(0, 10),
    uri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  });

  if (await tokenMetadataSdk.provider.connection.getAccountInfo(metadata)) {
    const { instructions: metaInstrs, signers: metaSigners } =
      await tokenMetadataSdk.updateMetadataInstructions({
        metadata,
        data,
      });

    instructions.push(...metaInstrs);
    signers.push(...metaSigners);
  } else {
    const { instructions: metaInstrs, signers: metaSigners } =
      await tokenMetadataSdk.createMetadataInstructions({
        mint: mintKey,
        data,
      });

    instructions.push(...metaInstrs);
    signers.push(...metaSigners);
  }
  
  await tokenMetadataSdk.sendInstructions(instructions, signers);

  return mintKey;
}

export const EditMetadataForm = ({
  values,
  onComplete,
}: {
  values: DefaultValues<IEditMetadataFormProps>;
  onComplete?: (mintKey: PublicKey) => void;
}) => {
  const formProps = useForm<IEditMetadataFormProps>({
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
  const { execute, loading, error } = useAsyncCallback(editMetadata);
  const { tokenMetadataSdk } = useStrataSdks();
  const { visible, setVisible } = useWalletModal();
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const { mint, name, symbol } = watch();
  const mintKey = usePublicKey(mint as string | undefined);
  const { metadata, image } = useTokenMetadata(mintKey);
  const insufficientAuthority = metadata?.updateAuthority
    ? metadata.updateAuthority != publicKey?.toBase58()
    : false;
  useEffect(() => {
    if (mint) {
      setValue("mint", mint as string);
    }
  }, [mint, router, setValue]);
  useEffect(() => {
    if (metadata) {
      setValue("name", metadata?.data.name);
      setValue("symbol", metadata?.data.symbol);
      (async () => {
        const imageFile = await getFileFromUrl(image, "image");
        if (imageFile) setValue("image", imageFile);
      })();
    }
  }, [setValue, metadata]);

  const onSubmit = async (values: IEditMetadataFormProps) => {
    await execute(tokenMetadataSdk!, values);
    onComplete && onComplete(new PublicKey(values.mint));
  };

  return (
    <Flex position="relative" w="100%">
      {!connected && (
        <Flex
          position="absolute"
          w="full"
          h="full"
          zIndex="1"
          flexDirection="column"
        >
          <Flex justifyContent="center">
            <Button
              colorScheme="orange"
              variant="outline"
              onClick={() => setVisible(!visible)}
            >
              Connect Wallet
            </Button>
          </Flex>
          <Flex w="full" h="full" bg="white" opacity="0.6" />
        </Flex>
      )}
      <FormProvider {...formProps}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
          <VStack spacing={8} w="full">
            <FormControlWithError
              id="mint"
              help="The mint/token id of the token whose metadata you wish to update."
              label="Mint"
              errors={errors}
            >
              {name && (
                <Text color="gray.400" size="sm">
                  {name} ({symbol})
                </Text>
              )}
              <MintSelect
                value={watch("mint") || ""}
                onChange={(s) => setValue("mint", s)}
              />
            </FormControlWithError>
            <TokenMetadataInputs entityName="Token" />
            <FormControlWithError
              id="symbol"
              help="A less than 10 character symbol for this token."
              label="Short Name"
              errors={errors}
            >
              <Input {...register("symbol")} />
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
    </Flex>
  );
};

const getFileFromUrl = async (
  url: string | undefined,
  name: string,
  defaultType: string = "image/jpeg"
): Promise<File | undefined> => {
  if (!url) {
    return undefined;
  }

  const data = await fetch(url, { cache: "no-cache" });
  const blob = await data.blob();
  const fileName = `${name}${blob.type === defaultType ? ".jpeg" : "png"}`;
  const file = new File([blob], fileName, { type: blob.type || defaultType });

  return file;
};
