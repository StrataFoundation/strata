import { Alert, Button, Heading, Input, VStack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { DataV2 } from "@metaplex-foundation/mpl-token-metadata";
import { NATIVE_MINT } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey } from "@solana/web3.js";
import { MarketplaceSdk } from "@strata-foundation/marketplace-sdk";
import {
  truthy,
  usePrimaryClaimedTokenRef,
  useProvider,
} from "@strata-foundation/react";
import { useMarketplaceSdk } from "contexts/marketplaceSdkContext";
import { useRouter } from "next/router";
import { route, routes } from "pages/routes";
import React from "react";
import { useAsyncCallback } from "react-async-hook";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { FormControlWithError } from "./FormControlWithError";
import {
  IMetadataFormProps,
  TokenMetadataInputs,
} from "./TokenMetadataInputs";

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
  values: IBountyFormProps
): Promise<PublicKey> {
  const mint = new PublicKey(values.mint);
  const authority = new PublicKey(values.authority);

  const targetMintKeypair = Keypair.generate();
  // const uri = await marketplaceSdk.tokenMetadataSdk.createArweaveMetadata({
  //   name: values.name,
  //   symbol: values.shortName,
  //   description: values.description,
  //   image: values.image?.name,
  //   files: [values.image].filter(truthy),
  //   mint: targetMintKeypair.publicKey,
  //   attributes: [
  //     {
  //       trait_type: "is_strata_bounty",
  //       display_type: "Strata Bounty",
  //       value: "true",
  //     },
  //     {
  //       trait_type: "contact",
  //       display_type: "Contact",
  //       value: values.contact,
  //     },
  //     {
  //       trait_type: "discussion",
  //       display_type: "Discussion",
  //       value: values.discussion,
  //     },
  //   ],
  // });
  const uri =
    "https://strata-token-metadata.s3.us-east-2.amazonaws.com/test-bounty.json";
  const { tokenBonding } = await marketplaceSdk.createBounty({
    targetMintKeypair,
    authority,
    metadata: new DataV2({
      name: values.name,
      symbol: values.shortName,
      uri,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    }),
    baseMint: mint
  });

  return tokenBonding;
}

export const BountyForm: React.FC = () => {
  const formProps = useForm<IBountyFormProps>({
    resolver: yupResolver(validationSchema),
  });
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = formProps;
  const { publicKey } = useWallet();
  const { info: tokenRef } = usePrimaryClaimedTokenRef(publicKey);
  const { awaitingApproval } = useProvider();
  const { loading, error } = useAsyncCallback(createBounty);
  const { marketplaceSdk } = useMarketplaceSdk();
  const router = useRouter();

  const onSubmit = async (values: IBountyFormProps) => {
    const tokenBondingKey = await createBounty(marketplaceSdk!, values);
    router.push(route(routes.bounty, { tokenBondingKey: tokenBondingKey.toBase58() }));
  };

  return (
    <FormProvider {...formProps}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={2}>
          <Heading>New Bounty</Heading>
          <TokenMetadataInputs />
          <FormControlWithError
            id="shortName"
            help="A less than 10 character name for this bounty. This will be the bounty token's symbol."
            label="Short Name"
            errors={errors}
          >
            <Input {...register("shortName")} />
          </FormControlWithError>
          <FormControlWithError
            id="authority"
            help="The wallet that must sign approve this bounty has been completed and disburse funds. 
            You can set yourself as the authority, paste an SPL Governance address here, or setup your own approval system."
            label="Bounty Authority"
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
            <Input {...register("authority")} />
          </FormControlWithError>
          <FormControlWithError
            id="contact"
            help="The contact information of the bounty authority"
            label="Authority Contact Information"
            errors={errors}
          >
            <Input {...register("contact")} />
          </FormControlWithError>
          <FormControlWithError
            id="discussion"
            help="A link to where this bounty is actively being discussed. This can be a github issue, forum link, etc. Use this to coordinate the bounty."
            label="Discussion"
            errors={errors}
          >
            <Input {...register("discussion")} />
          </FormControlWithError>

          <FormControlWithError
            id="mint"
            help={`The mint that should be used to on this bounty, example ${NATIVE_MINT.toBase58()} for SOL`}
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
            <Input {...register("mint")} />
          </FormControlWithError>

          {error && (
            <Alert status="error">
              <Alert status="error">{error.toString()}</Alert>
            </Alert>
          )}

          <Button
            type="submit"
            w="full"
            size="lg"
            colorScheme="blue"
            isLoading={isSubmitting || loading}
            loadingText={awaitingApproval ? "Awaiting Approval" : "Loading"}
          >
            Submit
          </Button>
        </VStack>
      </form>
    </FormProvider>
  );
};
