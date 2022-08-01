import { NFT_STORAGE_API_KEY } from "../../constants";
import {
  Alert,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Input,
  Stack,
  Image,
  Text,
  Switch,
  useRadioGroup,
  VStack,
  Flex,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { DataV2 } from "@metaplex-foundation/mpl-token-metadata";
import { NATIVE_MINT } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey } from "@solana/web3.js";
import { MarketplaceSdk } from "@strata-foundation/marketplace-sdk";
import {
  humanReadablePercentage,
  useCollective,
  useProvider,
  usePublicKey,
  useTokenMetadata,
} from "@strata-foundation/react";
import {
  ICurveConfig,
  TimeCurveConfig,
  TimeDecayExponentialCurveConfig,
} from "@strata-foundation/spl-token-bonding";
import {
  ITokenBondingSettings,
  SplTokenCollective,
} from "@strata-foundation/spl-token-collective";
import { useRouter } from "next/router";
import React from "react";
import { useAsync, useAsyncCallback } from "react-async-hook";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { useMarketplaceSdk } from "../..//contexts/marketplaceSdkContext";
import { route, routes } from "../../utils/routes";
import { FormControlWithError } from "./FormControlWithError";
import { MintSelect } from "./MintSelect";
import { IMetadataFormProps, TokenMetadataInputs } from "./TokenMetadataInputs";
import { Disclosures, disclosuresSchema, IDisclosures } from "./Disclosures";
import { RadioCardWithAffordance } from "./RadioCard";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

type CurveType = "aggressive" | "stable" | "utility";
interface IFullyManagedForm extends IMetadataFormProps {
  mint: string;
  symbol: string;
  curveType: CurveType;
  isSocial: boolean;
  startingPrice: number;
  isAntiBot: boolean;
  sellBaseRoyaltyPercentage: number;
  buyBaseRoyaltyPercentage: number;
  sellTargetRoyaltyPercentage: number;
  buyTargetRoyaltyPercentage: number;
  disclosures: IDisclosures;
}

const validationSchema = yup.object({
  mint: yup.string().required(),
  image: yup.mixed().required(),
  name: yup.string().required().min(2),
  description: yup.string().required().min(2),
  symbol: yup.string().required().min(2),
  startingPrice: yup.number().required().min(0),
  isAntiBot: yup.boolean(),
  isSocial: yup.boolean(),
  sellBaseRoyaltyPercentage: yup.number().required(),
  buyBaseRoyaltyPercentage: yup.number().required(),
  sellTargetRoyaltyPercentage: yup.number().required(),
  buyTargetRoyaltyPercentage: yup.number().required(),
  disclosures: disclosuresSchema,
});

async function createFullyManaged(
  marketplaceSdk: MarketplaceSdk,
  values: IFullyManagedForm
): Promise<PublicKey> {
  const mint = new PublicKey(values.mint);
  const tokenCollectiveSdk = marketplaceSdk.tokenCollectiveSdk;
  const tokenBondingSdk = tokenCollectiveSdk.splTokenBondingProgram;
  const targetMintKeypair = Keypair.generate();
  let k = 0;
  switch (values.curveType) {
    case "utility":
      k = 0.5;
      break;
    case "stable":
      k = 1;
      break;
    case "aggressive":
      k = 2;
      break;
  }

  const c = values.startingPrice * (k + 1);
  let config: ICurveConfig = new TimeDecayExponentialCurveConfig({
    c,
    k0: k,
    k1: k,
    d: 1,
    interval: 2 * 60 * 60, // 2 hours
  });
  if (values.isAntiBot) {
    config = new TimeCurveConfig()
      .addCurve(
        0,
        new TimeDecayExponentialCurveConfig({
          c,
          k0: 0,
          k1: 0,
          d: 1,
          interval: 0,
        })
      )
      .addCurve(
        30 * 60, // 30 minutes
        new TimeDecayExponentialCurveConfig({
          c,
          k0: 0,
          k1: k,
          d: 0.5,
          interval: 1.5 * 60 * 60, // 1.5 hours
        })
      );
  }
  const curveOut = await tokenBondingSdk.initializeCurveInstructions({
    config,
  });
  const bondingOpts = {
    baseMint: mint,
    buyBaseRoyaltyPercentage: values.buyBaseRoyaltyPercentage,
    buyTargetRoyaltyPercentage: values.buyTargetRoyaltyPercentage,
    sellBaseRoyaltyPercentage: values.sellBaseRoyaltyPercentage,
    sellTargetRoyaltyPercentage: values.sellTargetRoyaltyPercentage,
    curve: curveOut.output.curve,
    targetMint: targetMintKeypair.publicKey,
    targetMintDecimals: 9,
  };
  const uri = await tokenCollectiveSdk.splTokenMetadata.uploadMetadata({
    provider: values.provider,
    name: values.name,
    symbol: values.symbol,
    description: values.description,
    image: values.image,
    mint: targetMintKeypair.publicKey,
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

  if (values.isSocial) {
    const bondingOut = await tokenCollectiveSdk.createSocialTokenInstructions({
      mint,
      tokenBondingParams: bondingOpts,
      owner: tokenCollectiveSdk.wallet.publicKey,
      targetMintKeypair,
      metadata,
    });
    await tokenCollectiveSdk.executeBig(
      Promise.resolve({
        output: null,
        instructions: [curveOut.instructions, ...bondingOut.instructions],
        signers: [curveOut.signers, ...bondingOut.signers],
      })
    );
  } else {
    const metaOut = await marketplaceSdk.createMetadataForBondingInstructions({
      targetMintKeypair,
      metadataUpdateAuthority: tokenCollectiveSdk.wallet.publicKey,
      metadata,
      decimals: bondingOpts.targetMintDecimals,
    });

    const bondingOut = await tokenBondingSdk.createTokenBondingInstructions(
      bondingOpts
    );
    await tokenBondingSdk.executeBig(
      Promise.resolve({
        output: null,
        instructions: [
          [...curveOut.instructions, ...metaOut.instructions],
          bondingOut.instructions,
        ],
        signers: [
          [...curveOut.signers, ...metaOut.signers],
          bondingOut.signers,
        ],
      })
    );
  }

  return targetMintKeypair.publicKey;
}

export const FullyManagedForm: React.FC = () => {
  const formProps = useForm<IFullyManagedForm>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      disclosures: {
        acceptedFees: true,
      },
    },
  });
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = formProps;
  const { connected, publicKey } = useWallet();
  const { visible, setVisible } = useWalletModal();
  const { awaitingApproval } = useProvider();
  const { execute, loading, error } = useAsyncCallback(createFullyManaged);
  const { marketplaceSdk } = useMarketplaceSdk();
  const router = useRouter();

  function percentOr(percentu32: number | undefined, def: number) {
    return percentu32 ? Number(humanReadablePercentage(percentu32)) : def;
  }

  const onSubmit = async (values: IFullyManagedForm) => {
    const mintKey = await execute(marketplaceSdk!, values);
    router.push(
      route(routes.swap, {
        id: mintKey.toBase58(),
      }),
      undefined,
      { shallow: true }
    );
  };

  const { name = "", symbol = "", isSocial, mint, curveType } = watch();
  const mintKey = usePublicKey(mint);
  const { result: collectiveKey } = useAsync(
    async (mint: string | undefined) =>
      mint ? SplTokenCollective.collectiveKey(new PublicKey(mint)) : undefined,
    [mint]
  );
  const { info: collective } = useCollective(collectiveKey && collectiveKey[0]);
  const tokenBondingSettings = collective?.config
    .claimedTokenBondingSettings as ITokenBondingSettings | undefined;
  const {
    metadata: baseMetadata,
    error: baseMetadataError,
    loading: baseMetadataLoading,
  } = useTokenMetadata(mintKey);

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "curveType",
    onChange: (option) => setValue("curveType", option as CurveType),
  });

  const group = getRootProps();

  const curveOptions = [
    {
      value: "aggressive",
      heading: "Aggressive",
      illustration: "/aggressive.svg",
      helpText:
        "A curve with high price sensitivity. The price raises quickly when people buy, and lowers quickly when they sell. This is best suited for speculative use cases.",
    },
    {
      value: "stable",
      heading: "Stable",
      illustration: "/stable.svg",
      helpText:
        "A curve with medium price sensitivity. This curve changes price at a constant rate, achieving a balance between aggressive and utility curves.",
    },
    {
      value: "utility",
      heading: "Utility",
      illustration: "/utility.svg",
      helpText:
        "A curve with a price sensitivity that starts high and lowers with purchases. This curve is best suited for utility use cases, as it rewards early adopters and scales the supply so that the token can be exchanged for goods/services.",
    },
  ];

  return (
    <Flex position="relative">
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={8} mt={!connected ? 12 : 0}>
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
              id="curveType"
              label="Price Sensitivity"
              errors={errors}
            >
              <Stack
                {...group}
                direction={{ base: "column", md: "row" }}
                justifyContent="center"
                alignItems={{ base: "center", md: "normal" }}
              >
                {curveOptions.map(
                  ({ value, heading, illustration, helpText }) => {
                    const radio = getRadioProps({ value });

                    return (
                      <RadioCardWithAffordance key={value} {...radio}>
                        <Flex
                          h="full"
                          direction={{ base: "row", md: "column" }}
                          textAlign={{ base: "left", md: "center" }}
                        >
                          <Flex
                            justifyContent="center"
                            alignItems="center"
                            flexShrink={0}
                          >
                            <Image
                              src={illustration}
                              alt={`${value}-illustration`}
                              height="70px"
                              width="100%"
                            />
                          </Flex>
                          <Flex
                            flexGrow={1}
                            h="full"
                            direction="column"
                            alignItems={{ base: "start", md: "center" }}
                            justifyContent={{ base: "center", md: "initial" }}
                          >
                            <Text
                              fontWeight="bold"
                              fontSize="md"
                              pt={{ base: 0, md: 4 }}
                            >
                              {heading}
                            </Text>
                            <Flex
                              w="full"
                              flexGrow={{ base: 0, md: 1 }}
                              alignItems={{ base: "start", md: "center" }}
                            >
                              <Text fontSize="xs" color="gray.500">
                                {helpText}
                              </Text>
                            </Flex>
                          </Flex>
                        </Flex>
                      </RadioCardWithAffordance>
                    );
                  }
                )}
              </Stack>
            </FormControlWithError>

            <FormControlWithError
              id="isSocial"
              help={`If this is a social token, it will be associated with your wallet. This means applications like Wum.bo will be able to discover this token by looking up your wallet, which may be associated with your twitter handle, .sol domain, or any other web3 applications. A social token can be part of a network of other social tokens: a collective.`}
              label="Social Token?"
              errors={errors}
            >
              <Switch {...register("isSocial")} />
            </FormControlWithError>
            <FormControlWithError
              id="mint"
              help={`The mint that should be used to purchase this token, example ${NATIVE_MINT.toBase58()} for SOL`}
              label="Mint"
              errors={errors}
            >
              <MintSelect
                value={watch("mint")}
                onChange={(s) => setValue("mint", s)}
              />{" "}
            </FormControlWithError>

            <FormControlWithError
              id="startingPrice"
              help="The starting price of the token. The price will increase as more tokens are purchased"
              label="Starting Price"
              errors={errors}
            >
              <Input
                type="number"
                min={0}
                step={0.0000000001}
                {...register("startingPrice")}
              />
            </FormControlWithError>
            <FormControlWithError
              id="isAntiBot"
              help={`Enable anti botting measures. This will keep bots from profiting by frontrunning your token while the price is low. Your tokens true pricing will take 2 hours to come into effect`}
              label="Enable Anti Bot Measures?"
              errors={errors}
            >
              <Switch {...register("isAntiBot")} />
            </FormControlWithError>

            <VStack align="left" w="full">
              <Heading fontSize="xl" mb={4}>
                Royalties
              </Heading>
              <HStack>
                <FormControl
                  id="buyTargetRoyaltyPercentage"
                  borderColor="gray.200"
                >
                  <FormLabel>{symbol || "Managed Token"} (Buy)</FormLabel>
                  <Input
                    isRequired
                    type="number"
                    min={percentOr(
                      tokenBondingSettings?.minBuyTargetRoyaltyPercentage,
                      0
                    )}
                    max={percentOr(
                      tokenBondingSettings?.maxBuyTargetRoyaltyPercentage,
                      100
                    )}
                    placeholder="5"
                    defaultValue={5}
                    step={0.00001}
                    {...register("buyTargetRoyaltyPercentage")}
                  />
                </FormControl>
                <FormControl
                  id="sellTargetRoyaltyPercentage"
                  borderColor="gray.200"
                >
                  <FormLabel>{symbol || "Managed Token"} (Sell)</FormLabel>
                  <Input
                    isRequired
                    type="number"
                    min={percentOr(
                      tokenBondingSettings?.minSellTargetRoyaltyPercentage,
                      0
                    )}
                    max={percentOr(
                      tokenBondingSettings?.maxSellTargetRoyaltyPercentage,
                      100
                    )}
                    placeholder="0"
                    defaultValue={0}
                    step={0.00001}
                    {...register("sellTargetRoyaltyPercentage")}
                  />
                </FormControl>
              </HStack>
              <HStack>
                <FormControl
                  id="buyBaseRoyaltyPercentage"
                  borderColor="gray.200"
                >
                  <FormLabel>
                    {baseMetadata?.data.symbol || "Base Token"} (Buy)
                  </FormLabel>
                  <Input
                    isRequired
                    type="number"
                    min={percentOr(
                      tokenBondingSettings?.minBuyBaseRoyaltyPercentage,
                      0
                    )}
                    max={percentOr(
                      tokenBondingSettings?.maxBuyBaseRoyaltyPercentage,
                      100
                    )}
                    placeholder="0"
                    defaultValue={0}
                    step={0.00001}
                    {...register("buyBaseRoyaltyPercentage")}
                  />
                </FormControl>
                <FormControl
                  id="sellBaseRoyaltyPercentage"
                  borderColor="gray.200"
                >
                  <FormLabel>
                    {baseMetadata?.data.symbol || "Base Token"} (Sell)
                  </FormLabel>
                  <Input
                    isRequired
                    type="number"
                    min={percentOr(
                      tokenBondingSettings?.minSellBaseRoyaltyPercentage,
                      0
                    )}
                    max={percentOr(
                      tokenBondingSettings?.maxSellBaseRoyaltyPercentage,
                      100
                    )}
                    placeholder="0"
                    defaultValue={0}
                    step={0.00001}
                    {...register("sellBaseRoyaltyPercentage")}
                  />
                </FormControl>
              </HStack>
              <FormControl>
                <FormHelperText>
                  A Percentage of coin buys/sales that will be sent to your
                  wallet. We recommend to keep this less than a combined 10% for
                  buys/sales.
                </FormHelperText>
              </FormControl>
            </VStack>

            <Disclosures fees={0} />

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
    </Flex>
  );
};
