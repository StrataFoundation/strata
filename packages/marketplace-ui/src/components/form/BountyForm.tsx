import { NFT_STORAGE_API_KEY } from "@/constants";
import { Alert, Button, Input, VStack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { DataV2 } from "@metaplex-foundation/mpl-token-metadata";
import { NATIVE_MINT } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey } from "@solana/web3.js";
import { MarketplaceSdk } from "@strata-foundation/marketplace-sdk";
import {
  truthy,
  useMintTokenRef,
  usePrimaryClaimedTokenRef,
  useProvider,
  usePublicKey,
} from "@strata-foundation/react";
import React, { useEffect } from "react";
import { useAsyncCallback } from "react-async-hook";
import { DefaultValues, FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { useMarketplaceSdk } from "../../contexts/marketplaceSdkContext";
import { FormControlWithError } from "./FormControlWithError";
import { MintSelect } from "./MintSelect";
import { Recipient } from "./Recipient";
import { IMetadataFormProps, TokenMetadataInputs } from "./TokenMetadataInputs";

interface IBountyFormProps extends IMetadataFormProps {
  mint: string;
  shortName: string;
  contact: string;
  discussion: string;
  authority: string;
}

const validationSchema = yup.object({
  mint: yup.string().required(),
  image: yup.mixed(),
  name: yup.string().required().min(2),
  description: yup.string(),
  shortName: yup.string().min(2).max(10),
  contact: yup.string(),
  discussion: yup.string(),
  authority: yup.string().required(),
});

async function createBounty(
  marketplaceSdk: MarketplaceSdk,
  values: IBountyFormProps,
  nftStorageApiKey: string | undefined = NFT_STORAGE_API_KEY
): Promise<PublicKey> {
  const mint = new PublicKey(values.mint);
  const authority = new PublicKey(values.authority);

  const targetMintKeypair = Keypair.generate();
  const uri = await marketplaceSdk.tokenMetadataSdk.uploadMetadata({
    provider: values.provider,
    name: values.name,
    symbol: values.shortName,
    description: values.description,
    image: values.image,
    mint: targetMintKeypair.publicKey,
    attributes: MarketplaceSdk.bountyAttributes({
      mint,
      discussion: values.discussion,
      contact: values.contact,
    }),
    nftStorageApiKey,
  });
  const { targetMint } = await marketplaceSdk.createBounty({
    targetMintKeypair,
    authority,
    metadataUpdateAuthority: marketplaceSdk.provider.wallet.publicKey,
    metadata: new DataV2({
      // Max name len 32
      name: values.name.substring(0, 32),
      symbol: values.shortName.substring(0, 10),
      uri,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    }),
    baseMint: mint,
  });

  return targetMint;
}

export const BountyForm = ({
  defaultValues = {},
  onComplete,
  hide = new Set(),
  nftStorageApiKey = NFT_STORAGE_API_KEY,
}: {
  defaultValues?: DefaultValues<IBountyFormProps>;
  onComplete?: (mintKey: PublicKey) => void;
  hide?: Set<string>;
  nftStorageApiKey?: string;
}) => {
  const formProps = useForm<IBountyFormProps>({
    resolver: yupResolver(validationSchema),
    defaultValues,
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = formProps;
  const { publicKey } = useWallet();
  const { info: tokenRef } = usePrimaryClaimedTokenRef(publicKey);
  const { awaitingApproval } = useProvider();
  const { execute, loading, error } = useAsyncCallback(createBounty);
  const { marketplaceSdk } = useMarketplaceSdk();
  const { authority, mint } = watch();
  const mintKey = usePublicKey(mint);
  const { info: mintTokenRef } = useMintTokenRef(mintKey);

  // Social tokens should default bounties to the owner of the social token
  // as the authority. This is generally better because if the owner acts in
  // bad faith, they'll collapse the value of their own token. Vs a fan who can
  // easily not give money to the creator
  useEffect(() => {
    if (!authority && mintTokenRef) {
      const owner = mintTokenRef.owner as PublicKey | undefined;
      if (owner) {
        setValue("authority", owner.toBase58());
      } else {
        setValue("authority", mintTokenRef.publicKey.toBase58());
      }
    }
  }, [mintTokenRef]);

  const onSubmit = async (values: IBountyFormProps) => {
    const mintKey = await execute(marketplaceSdk!, values, nftStorageApiKey);
    onComplete && onComplete(mintKey);
  };

  const authorityRegister = register("authority");

  return (
    <FormProvider {...formProps}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={8}>
          <TokenMetadataInputs />
          <FormControlWithError
            id="shortName"
            help="A less than 10 character name for this bounty. This will be the bounty token's symbol."
            label="Short Name"
            errors={errors}
          >
            <Input {...register("shortName")} />
          </FormControlWithError>

          {!hide.has("mint") && (
            <FormControlWithError
              id="mint"
              help={`The mint that should be used on this bounty, example ${NATIVE_MINT.toBase58()} for SOL`}
              label="Mint"
              errors={errors}
            >
              {tokenRef && (
                <Button
                  variant="link"
                  onClick={() => setValue("mint", tokenRef.mint.toBase58())}
                >
                  Use my Social Token
                </Button>
              )}
              <MintSelect
                value={watch("mint")}
                onChange={(s) => setValue("mint", s)}
              />
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
