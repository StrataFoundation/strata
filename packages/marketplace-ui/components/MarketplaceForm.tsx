import { Alert, Button, Heading, Input, VStack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { DataV2 } from "@metaplex-foundation/mpl-token-metadata";
import { NATIVE_MINT } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey } from "@solana/web3.js";
import { MarketplaceSdk } from "@strata-foundation/marketplace-sdk";
import { truthy, usePrimaryClaimedTokenRef, useProvider } from "@strata-foundation/react";
import { useMarketplaceSdk } from "contexts/marketplaceSdkContext";
import { useRouter } from 'next/router';
import React from "react";
import { useAsyncCallback } from "react-async-hook";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { FormControlWithError } from "./form/FormControlWithError";
import { IMetadataFormProps, TokenMetadataInputs } from "./form/TokenMetadataInputs";

interface IMarketplaceFormProps extends IMetadataFormProps{
  mint: string;
  quantity: number;
  price: number;
}

const validationSchema = yup.object({
  mint: yup.string().required(),
  image: yup.mixed(),
  name: yup.string().required().min(2),
  description: yup.string().required().min(2),
  quantity: yup.number().required().min(1).integer(),
  price: yup.number().required().min(0)
})

async function createMarket(marketplaceSdk: MarketplaceSdk, values: IMarketplaceFormProps): Promise<PublicKey> {
  const mint = new PublicKey(values.mint);

  const targetMintKeypair = Keypair.generate();
  const uri = await marketplaceSdk.tokenMetadataSdk.createArweaveMetadata({
    name: values.name,
    symbol: "",
    description: values.description,
    image: values.image?.name,
    files: [values.image].filter(truthy),
    mint: targetMintKeypair.publicKey,
  }) 
  const { tokenBonding } = await marketplaceSdk.createMarketItem({
    targetMintKeypair,
    metadata: new DataV2({
      name: values.name,
      symbol: "",
      uri,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null
    }),
    quantity: values.quantity,
    price: values.price,
    baseMint: mint
  });

  return tokenBonding; 
}

export const MarketplaceFrom: React.FC = () => {
  const formProps = useForm<IMarketplaceFormProps>({
    resolver: yupResolver(validationSchema)
  });
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = formProps;
  const { publicKey } = useWallet();
  const { info: tokenRef } = usePrimaryClaimedTokenRef(publicKey)
  const { awaitingApproval } = useProvider();
  const { loading, error } = useAsyncCallback(createMarket);
  const { marketplaceSdk } = useMarketplaceSdk();
  const router = useRouter();

  const onSubmit = async (values: IMarketplaceFormProps) => {
    const tokenBondingKey = await createMarket(marketplaceSdk!, values)
    router.push("/item/" + tokenBondingKey.toBase58())
  }

  return <FormProvider {...formProps}>
    <form
      onSubmit={handleSubmit(onSubmit)}
    >
      <VStack spacing={2}>
        <Heading>Sell an Item</Heading>
        <TokenMetadataInputs />
        <FormControlWithError
          id="quantity"
          help="The quantity to stop selling at"
          label="Quantity"
          errors={errors}
        >
          <Input type="number" min={1} step={1} {...register("quantity")} />
        </FormControlWithError>
        <FormControlWithError
          id="mint"
          help={`The mint that should be used to purchase this, example ${NATIVE_MINT.toBase58()}`}
          label="Mint"
          errors={errors}
        >
           {tokenRef && <Button
            variant="link"
            onClick={() => setValue("mint", tokenRef.mint.toBase58())}
          >
            Use my Social Token
          </Button>}
          <Input {...register("mint")} />
        </FormControlWithError>
        <FormControlWithError
          id="price"
          help="The price of the item"
          label="Price"
          errors={errors}
        >
          <Input type="number" min={0} step={0.0000000001} {...register("price")} />
        </FormControlWithError>

        {error && <Alert status="error">
          <Alert status="error">
            {error.toString()}
          </Alert>
        </Alert>}

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
}
