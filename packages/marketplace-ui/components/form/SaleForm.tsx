import { Alert, Box, Button, Collapse, Flex, Icon, Input, useDisclosure, VStack } from "@chakra-ui/react";
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
import { BsChevronDown } from "react-icons/bs";
import { route, routes } from "utils/routes";
import * as yup from "yup";
import { FormControlWithError } from "./FormControlWithError";
import { MintSelect } from "./MintSelect";
import { IMetadataFormProps, TokenMetadataInputs } from "./TokenMetadataInputs";

interface IMarketplaceFormProps extends IMetadataFormProps{
  mint: string;
  quantity: number;
  price: number;
  curve: string;
}

const validationSchema = yup.object({
  mint: yup.string().required(),
  image: yup.mixed(),
  name: yup.string().required().min(2),
  description: yup.string().required().min(2),
  quantity: yup.number().required().min(1).integer(),
  price: yup.number().required().min(0),
  curve: yup.string()
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
    attributes: [
      {
        trait_type: "is_strata_sale",
        display_type: "Strata Sale",
        value: "true",
      },
    ],
  }); 
  await marketplaceSdk.createMarketItem({
    targetMintKeypair,
    metadata: new DataV2({
      name: values.name,
      symbol: "",
      uri,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    }),
    quantity: values.quantity,
    price: values.price,
    baseMint: mint,
    bondingArgs: {
      curve: values.curve ? new PublicKey(values.curve) : undefined
    }
  });

  return targetMintKeypair.publicKey; 
}

export const SaleForm: React.FC = () => {
  const formProps = useForm<IMarketplaceFormProps>({
    resolver: yupResolver(validationSchema)
  });
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch
  } = formProps;
  const { publicKey } = useWallet();
  const { info: tokenRef } = usePrimaryClaimedTokenRef(publicKey)
  const { awaitingApproval } = useProvider();
  const { execute, loading, error } = useAsyncCallback(createMarket);
  const { marketplaceSdk } = useMarketplaceSdk();
  const router = useRouter();
  const { isOpen, onToggle } = useDisclosure();


  const onSubmit = async (values: IMarketplaceFormProps) => {
    const mintKey = await execute(marketplaceSdk!, values)
    router.push(route(routes.sale, {
      mintKey: mintKey.toBase58()
    }))
  }

  return (
    <FormProvider {...formProps}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={8}>
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
            />{" "}
          </FormControlWithError>
          <FormControlWithError
            id="price"
            help="The price of the item"
            label="Price"
            errors={errors}
          >
            <Input
              type="number"
              min={0}
              step={0.0000000001}
              {...register("price")}
            />
          </FormControlWithError>
          <Flex alignItems="flex-start" direction="column" w="full">
            <Button
              textAlign="left"
              rightIcon={<Icon as={BsChevronDown} />}
              variant="link"
              onClick={onToggle}
            >
              Advanced Settings
            </Button>
            <Box w="full">
              <Collapse in={isOpen} animateOpacity>
                <FormControlWithError
                  id="curve"
                  help="The pricing curve to use for this item"
                  label="Curve"
                  errors={errors}
                >
                  <Input {...register("curve")} />
                </FormControlWithError>
              </Collapse>
            </Box>
          </Flex>

          {error && (
            <Alert status="error">
              <Alert status="error">{error.toString()}</Alert>
            </Alert>
          )}

          <Button
            type="submit"
            alignSelf="flex-end"
            colorScheme="orange"
            isLoading={isSubmitting || loading}
            loadingText={awaitingApproval ? "Awaiting Approval" : "Loading"}
          >
            Create Sale
          </Button>
        </VStack>
      </form>
    </FormProvider>
  );
}
