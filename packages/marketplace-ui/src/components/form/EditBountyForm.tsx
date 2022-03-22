import {
  Alert,
  Button,
  Center,
  Input,
  Spinner,
  VStack,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { DataV2, Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { MarketplaceSdk } from "@strata-foundation/marketplace-sdk";
import {
  truthy,
  useProvider,
  useStrataSdks,
  useTokenBondingFromMint,
  useTokenMetadata,
} from "@strata-foundation/react";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { SplTokenMetadata } from "@strata-foundation/spl-utils";
import { useRouter } from "next/router";
import React from "react";
import { useAsync, useAsyncCallback } from "react-async-hook";
import { DefaultValues, FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { FormControlWithError } from "./FormControlWithError";
import { Recipient } from "./Recipient";
import { IMetadataFormProps, TokenMetadataInputs } from "./TokenMetadataInputs";
import { NFT_STORAGE_API_KEY } from "@/constants";

interface IEditBountyFormProps extends IMetadataFormProps {
  shortName: string;
  contact: string;
  discussion: string;
  authority: string;
}

const validationSchema = yup.object({
  image: yup.mixed(),
  name: yup.string().required().min(2),
  description: yup.string(),
  shortName: yup.string().min(2).max(10),
  contact: yup.string(),
  discussion: yup.string(),
  authority: yup.string().required(),
});

async function editBounty(
  tokenMetadataSdk: SplTokenMetadata,
  tokenBondingSdk: SplTokenBonding,
  values: IEditBountyFormProps,
  mintKey: PublicKey,
  nftStorageApiKey: string | undefined = NFT_STORAGE_API_KEY
): Promise<PublicKey> {
  const uri = await tokenMetadataSdk.uploadMetadata({
    provider: values.provider,
    name: values.name,
    symbol: values.shortName,
    description: values.description,
    image: values.image,
    mint: mintKey,
    attributes: MarketplaceSdk.bountyAttributes({
      mint: mintKey,
      discussion: values.discussion,
      contact: values.contact,
    }),
    nftStorageApiKey,
  });

  const instructions = [];
  const signers = [];
  const { instructions: metaInstrs, signers: metaSigners } =
    await tokenMetadataSdk.updateMetadataInstructions({
      metadata: await Metadata.getPDA(mintKey),
      data: new DataV2({
        // Max name len 32
        name: values.name.substring(0, 32),
        symbol: values.shortName.substring(0, 10),
        uri,
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
      }),
    });

  instructions.push(...metaInstrs);
  signers.push(...metaSigners);

  const tokenBondingKey = (await SplTokenBonding.tokenBondingKey(mintKey))[0];
  const tokenBondingAcct = await tokenBondingSdk.getTokenBonding(
    tokenBondingKey
  );
  if (
    values.authority &&
    tokenBondingSdk.wallet.publicKey.equals(
      tokenBondingAcct!.reserveAuthority as PublicKey
    )
  ) {
    const authority = new PublicKey(values.authority);

    const { instructions: bondInstrs, signers: bondSigners } =
      await tokenBondingSdk.updateTokenBondingInstructions({
        tokenBonding: tokenBondingKey,
        generalAuthority: authority,
        reserveAuthority: authority,
      });

    instructions.push(...bondInstrs);
    signers.push(...bondSigners);
  }

  await tokenBondingSdk.sendInstructions(instructions, signers);

  return mintKey;
}

export const EditBountyFormRaw = ({
  mintKey,
  values,
  onComplete,
  hide = new Set(),
  nftStorageApiKey = NFT_STORAGE_API_KEY,
}: {
  mintKey: PublicKey;
  values: DefaultValues<IEditBountyFormProps>;
  onComplete?: () => void;
  hide?: Set<string>;
  nftStorageApiKey?: string;
}) => {
  const formProps = useForm<IEditBountyFormProps>({
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
  const { publicKey } = useWallet();
  const { awaitingApproval } = useProvider();
  const { execute, loading, error } = useAsyncCallback(editBounty);
  const { tokenMetadataSdk, tokenBondingSdk } = useStrataSdks();
  const router = useRouter();
  const authority = watch("authority");

  const onSubmit = async (values: IEditBountyFormProps) => {
    await execute(
      tokenMetadataSdk!,
      tokenBondingSdk!,
      values,
      mintKey,
      nftStorageApiKey
    );
    onComplete && onComplete();
  };

  const authorityRegister = register("authority");

  return (
    <FormProvider {...formProps}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={8}>
          <TokenMetadataInputs />
          {!hide.has("shortName") && (
            <FormControlWithError
              id="shortName"
              help="A less than 10 character name for this bounty. This will be the bounty token's symbol."
              label="Short Name"
              errors={errors}
            >
              <Input {...register("shortName")} />
            </FormControlWithError>
          )}

          {!hide.has("authority") && (
            <FormControlWithError
              id="authority"
              help="The wallet that signs to disburse the funds of this bounty when it is completed. 
            For social tokens, this defaults to the wallet associated with the social token. This
            can also be an SPL Governance address or a multisig."
              label="Approver"
              errors={errors}
            >
              {publicKey && (
                <Button
                  variant="link"
                  onClick={() => setValue("authority", publicKey.toBase58())}
                >
                  Set to My Wallet
                </Button>
              )}
              <Recipient
                name={authorityRegister.name}
                value={authority}
                onChange={authorityRegister.onChange}
              />
            </FormControlWithError>
          )}
          {!hide.has("contact") && (
            <FormControlWithError
              id="contact"
              help="Who to contact regarding the bounty. This can be an email address, twitter handle, etc."
              label="Contact Information"
              errors={errors}
            >
              <Input {...register("contact")} />
            </FormControlWithError>
          )}
          {!hide.has("discussion") && (
            <FormControlWithError
              id="discussion"
              help="A link to where this bounty is actively being discussed. This can be a github issue, forum link, etc. Use this to coordinate the bounty."
              label="Discussion"
              errors={errors}
            >
              <Input {...register("discussion")} />
            </FormControlWithError>
          )}

          {error && <Alert status="error">{error.toString()}</Alert>}

          <Button
            type="submit"
            alignSelf="flex-end"
            colorScheme="primary"
            isLoading={isSubmitting || loading}
            loadingText={awaitingApproval ? "Awaiting Approval" : "Loading"}
          >
            Send Bounty
          </Button>
        </VStack>
      </form>
    </FormProvider>
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

export const EditBountyForm = ({
  mintKey,
  onComplete,
  hide = new Set(),
}: {
  mintKey: PublicKey;
  onComplete?: () => void;
  hide?: Set<string>;
}) => {
  const { info: tokenBonding, loading: loadingBonding } =
    useTokenBondingFromMint(mintKey);

  const {
    displayName,
    image,
    metadata,
    data,
    loading: loadingMetadata,
  } = useTokenMetadata(mintKey);
  const { result: file, loading } = useAsync(getFileFromUrl, [image, "image"]);
  const attributes = React.useMemo(
    () => SplTokenMetadata.attributesToRecord(data?.attributes),
    [data]
  );

  if (
    loadingBonding ||
    loadingMetadata ||
    loading ||
    !tokenBonding ||
    !metadata
  ) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  return (
    <EditBountyFormRaw
      hide={new Set(["contact", "discussion"])}
      onComplete={onComplete}
      mintKey={mintKey}
      values={{
        authority: (tokenBonding!.reserveAuthority as PublicKey).toBase58(),
        name: displayName!,
        image: file,
        description: data?.description,
        shortName: metadata?.data.symbol,
        contact: attributes?.contact as string,
        discussion: attributes?.discussion as string,
      }}
    />
  );
};
