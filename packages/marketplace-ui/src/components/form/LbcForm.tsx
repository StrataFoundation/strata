import {
  Alert,
  Box,
  Button,
  Collapse,
  Flex,
  Input,
  Switch,
  VStack,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { DataV2 } from "@metaplex-foundation/mpl-token-metadata";
import { Program } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  LBC_CURVE_FEES,
  MarketplaceSdk,
} from "@strata-foundation/marketplace-sdk";
import {
  usePrimaryClaimedTokenRef,
  useProvider,
  useEndpoint,
} from "@strata-foundation/react";
import BN from "bn.js";
import {
  getMintInfo,
  sendMultipleInstructions,
} from "@strata-foundation/spl-utils";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useAsyncCallback } from "react-async-hook";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { useMarketplaceSdk } from "../../contexts/marketplaceSdkContext";
import { route, routes } from "../../utils/routes";
import { Disclosures, disclosuresSchema, IDisclosures } from "./Disclosures";
import { FormControlWithError } from "./FormControlWithError";
import { MintSelect } from "./MintSelect";
import { Recipient } from "./Recipient";
import { IMetadataFormProps, TokenMetadataInputs } from "./TokenMetadataInputs";
import {
  IUseExistingMintProps,
  UseExistingMintInputs,
} from "./UseExistingMintInputs";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { TokenMintDecimalsInputs } from "./TokenMintDecimalsInputs";
import { TokenIntervalInputs } from "./TokenIntervalnputs";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";

interface ILbcFormProps
  extends Partial<IMetadataFormProps>,
    IUseExistingMintProps {
  useCandyMachine: boolean;
  convertCandyMachine: boolean;
  candyMachineId: string;
  sellFrozen: boolean;
  mint: string;
  symbol?: string;
  authority: string;
  startPrice: number;
  minPrice: number;
  decimals?: number;
  interval: number;
  mintCap: number;
  goLiveDate: Date;
  disclosures: IDisclosures;
}

const validationSchema = yup.object({
  mint: yup.string().required(),
  useExistingMint: yup.boolean(),
  useCandyMachine: yup.boolean(),
  sellFrozen: yup.boolean(),
  convertCandyMachine: yup.boolean(),
  existingMint: yup.string().when(["useExistingMint", "useCandyMachine"], {
    is: (useExistingMint: boolean, useCandyMachine: boolean) =>
      useExistingMint && !useCandyMachine,
    then: yup.string().required(),
  }),
  candyMachineId: yup.string().when("useCandyMachine", {
    is: true,
    then: yup.string().required(),
  }),
  image: yup.mixed(),
  name: yup.string().when(["useExistingMint", "useCandyMachine"], {
    is: (one: boolean, two: boolean) => !one && !two,
    then: yup.string().required().min(2),
  }),
  description: yup.string(),
  symbol: yup.string().when("useExistingMint", {
    is: false,
    then: yup.string(),
  }),
  authority: yup.string().required(),
  startPrice: yup.number().min(0).required(),
  minPrice: yup.number().min(0).required(),
  interval: yup.number().min(0).required(),
  decimals: yup
    .number()
    .nullable()
    .transform((v) => {
      return v === "" || isNaN(v) ? null : v;
    })
    .when(["useExistingMint", "useCandyMachine"], {
      is: (one: boolean, two: boolean) => !one && !two,
      then: yup.number().min(0).required(),
    }),
  mintCap: yup.number().min(1).required(),
  goLiveDate: yup.date().required(),
  disclosures: disclosuresSchema,
});

async function createLbcCandyMachine(
  marketplaceSdk: MarketplaceSdk,
  values: ILbcFormProps,
  cluster: WalletAdapterNetwork | "localnet"
): Promise<string> {
  const targetMintKeypair = Keypair.generate();
  const authority = new PublicKey(values.authority);
  const mint = new PublicKey(values.mint);

  const metadata = new DataV2({
    // Max name len 32
    name: "Candymachine Mint Token",
    symbol: "NFTs",
    uri: "",
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  });

  const {
    output: { targetMint },
    instructions,
    signers,
  } = await marketplaceSdk.createLiquidityBootstrapperInstructions({
    targetMintKeypair,
    authority,
    metadata,
    baseMint: mint,
    startPrice: Number(values.startPrice),
    minPrice: Number(values.minPrice),
    interval: Number(values.interval),
    maxSupply: Number(values.mintCap),
    bondingArgs: {
      targetMintDecimals: Number(values.decimals || 0),
      goLiveDate: values.goLiveDate,
      sellFrozen: true,
    },
  });

  // Update the candymachine to use this mint
  if (values.useCandyMachine && values.convertCandyMachine) {
    const candyMachineId = new PublicKey(values.candyMachineId);
    const incinerator = new PublicKey(
      "gravk12G8FF5eaXaXSe4VEC8BhkxQ7ig5AHdeVdPmDF"
    );
    const incineratorAta = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      targetMint,
      incinerator,
      true
    );
    const lastInstrs = instructions[instructions.length - 1];
    lastInstrs.push(
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        targetMint,
        incineratorAta,
        incinerator,
        marketplaceSdk.provider.wallet.publicKey
      )
    );
    const candymachineIdl = await Program.fetchIdl(
      new PublicKey("cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ"),
      marketplaceSdk.provider
    );
    const candymachineProgram = new Program(
      candymachineIdl!,
      new PublicKey("cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ"),
      marketplaceSdk.provider
    );
    const candymachine: any =
      await candymachineProgram.account.candyMachine.fetch(candyMachineId);
    const ix = await candymachineProgram.instruction.updateCandyMachine(
      {
        ...candymachine.data,
        price: new BN(1),
      },
      {
        accounts: {
          candyMachine: candyMachineId,
          authority: marketplaceSdk.provider.wallet.publicKey,
          wallet: incineratorAta,
        },
      }
    );
    ix.keys.push({
      pubkey: targetMint,
      isWritable: false,
      isSigner: false,
    });
    lastInstrs.push(ix);
  }

  await sendMultipleInstructions(
    marketplaceSdk.tokenBondingSdk.errors || new Map(),
    marketplaceSdk.provider,
    instructions,
    signers
  );

  return route(routes.mintLbcAdmin, {
    candyMachineId: values.candyMachineId,
    tokenBondingKey: (
      await SplTokenBonding.tokenBondingKey(targetMint)
    )[0].toBase58(),
    cluster,
  });
}

/**
 * For an existing mint, the token is sold using an LBC and a fungible entangler.
 * The LBC converts between the base to and from an intermediary token.
 * The fungible entangler converts between the intermediary to and from the token to sell.
 *
 * This makes the sale process reversible without requiring the mint authority.
 */
async function createLbcExistingMint(
  marketplaceSdk: MarketplaceSdk,
  values: ILbcFormProps
): Promise<string> {
  const intermediaryMintKeypair = Keypair.generate();
  const authority = new PublicKey(values.authority);
  const mint = new PublicKey(values.mint);
  const existingMint = new PublicKey(values.existingMint!);

  values.decimals = (
    await getMintInfo(marketplaceSdk.provider, existingMint)
  ).decimals;

  const metadata = new DataV2({
    name: values.name || "",
    symbol: values.symbol || "",
    uri: values.uri || "",
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  });

  const {
    output: { targetMint: intermediaryMint },
    instructions,
    signers,
  } = await marketplaceSdk.createLiquidityBootstrapperInstructions({
    targetMintKeypair: intermediaryMintKeypair,
    authority,
    metadata,
    baseMint: mint,
    startPrice: Number(values.startPrice),
    minPrice: Number(values.minPrice),
    interval: Number(values.interval),
    maxSupply: Number(values.mintCap),
    bondingArgs: {
      targetMintDecimals: Number(values.decimals || 0),
      goLiveDate: values.goLiveDate,
      sellFrozen: values.sellFrozen,
    },
  });

  const entanglerInstrs =
    await marketplaceSdk.fungibleEntanglerSdk.createFungibleEntanglerInstructions(
      {
        authority,
        dynamicSeed: Keypair.generate().publicKey.toBuffer(),
        amount: values.mintCap,
        parentMint: existingMint, // swaps from childMint to parentMint
        childMint: intermediaryMint,
      }
    );
  instructions.push(entanglerInstrs.instructions);
  signers.push(entanglerInstrs.signers);

  await sendMultipleInstructions(
    marketplaceSdk.tokenBondingSdk.errors || new Map(),
    marketplaceSdk.provider,
    instructions,
    signers
  );
  return route(routes.tokenLbcAdmin, {
    id: entanglerInstrs.output.childEntangler.toString(),
  });
}

async function createLbcNewMint(
  marketplaceSdk: MarketplaceSdk,
  values: ILbcFormProps
): Promise<string> {
  const targetMintKeypair = Keypair.generate();
  const authority = new PublicKey(values.authority);
  const mint = new PublicKey(values.mint);

  const uri = await marketplaceSdk.tokenMetadataSdk.uploadMetadata({
    provider: values.provider,
    name: values.name!,
    symbol: values.symbol! || "",
    description: values.description,
    image: values.image,
    mint: targetMintKeypair.publicKey,
  });
  const metadata = new DataV2({
    // Max name len 32
    name: values.name!.substring(0, 32),
    symbol: (values.symbol || "").substring(0, 10),
    uri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  });

  const {
    output: { targetMint },
    instructions,
    signers,
  } = await marketplaceSdk.createLiquidityBootstrapperInstructions({
    targetMintKeypair,
    authority,
    metadata,
    baseMint: mint,
    startPrice: Number(values.startPrice),
    minPrice: Number(values.minPrice),
    interval: Number(values.interval),
    maxSupply: Number(values.mintCap),
    bondingArgs: {
      targetMintDecimals: Number(values.decimals || 0),
      goLiveDate: values.goLiveDate,
      sellFrozen: values.sellFrozen,
    },
  });

  await sendMultipleInstructions(
    marketplaceSdk.tokenBondingSdk.errors || new Map(),
    marketplaceSdk.provider,
    instructions,
    signers
  );

  return route(routes.tokenLbcAdmin, { id: targetMint.toBase58() });
}

async function createLiquidityBootstrapper(
  marketplaceSdk: MarketplaceSdk,
  values: ILbcFormProps,
  cluster: WalletAdapterNetwork | "localnet"
): Promise<string> {
  if (values.useCandyMachine) {
    return await createLbcCandyMachine(marketplaceSdk, values, cluster);
  } else if (values.useExistingMint) {
    return await createLbcExistingMint(marketplaceSdk, values);
  } else {
    return await createLbcNewMint(marketplaceSdk, values);
  }
}

export const LbcForm: React.FC = () => {
  const formProps = useForm<ILbcFormProps>({
    resolver: yupResolver(validationSchema),
    defaultValues: { useExistingMint: true },
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = formProps;
  const { publicKey, connected } = useWallet();
  const { visible, setVisible } = useWalletModal();
  const { info: tokenRef } = usePrimaryClaimedTokenRef(publicKey);
  const { awaitingApproval } = useProvider();
  const { execute, loading, error } = useAsyncCallback(
    createLiquidityBootstrapper
  );
  const { cluster } = useEndpoint();
  const { marketplaceSdk } = useMarketplaceSdk();
  const router = useRouter();
  const {
    authority,
    convertCandyMachine,
    useExistingMint,
    useCandyMachine,
    startPrice,
    minPrice,
  } = watch();

  useEffect(() => {
    setValue("useCandyMachine", !!router.query["candymachine"]);
    setValue("convertCandyMachine", !!router.query["candymachine"]);
  }, [router, setValue]);

  useEffect(() => {
    if (startPrice && minPrice) {
      if (minPrice < startPrice / 5) {
        setError("startPrice", {
          type: "custom",
          message:
            "The diffrence between Starting Price and Minimum Price is greater than the reccommended 5x of each other.",
        });
        setError("minPrice", {
          type: "custom",
          message:
            "The diffrence between Minimum Price and Starting Price is greater than the reccommended 5x of each other.",
        });
      } else {
        clearErrors("minPrice");
        clearErrors("startPrice");
      }
    }
  }, [startPrice, minPrice, setError, clearErrors]);

  const onSubmit = async (values: ILbcFormProps) => {
    const url = await execute(marketplaceSdk!, values, cluster);
    if (values.useCandyMachine) {
      router.push(url, undefined, { shallow: true });
    } else {
      router.push(url, undefined, { shallow: true });
    }
  };

  const authorityRegister = register("authority");

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
            {!useCandyMachine && <UseExistingMintInputs />}

            <Box w="full">
              <Collapse in={useCandyMachine} animateOpacity>
                <FormControlWithError
                  id="candyMachineId"
                  help="The id of the candymachine"
                  label="Candy Machine ID"
                  errors={errors}
                >
                  <Input {...register("candyMachineId")} />
                </FormControlWithError>
              </Collapse>
              <Collapse
                in={!useExistingMint && !useCandyMachine}
                animateOpacity
              >
                <VStack spacing={8}>
                  <TokenMetadataInputs entityName="token" />
                  <TokenMintDecimalsInputs />
                  <FormControlWithError
                    id="symbol"
                    help="A less than 10 character symbol for the token being sold"
                    label="Symbol"
                    errors={errors}
                  >
                    <Input {...register("symbol")} />
                  </FormControlWithError>
                </VStack>
              </Collapse>
            </Box>

            <FormControlWithError
              id="mint"
              help={`The token that should be used to buy this token. If you want users to purchase your token using SOL, use ${NATIVE_MINT.toBase58()}`}
              label="Purchase Mint"
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

            <FormControlWithError
              id="authority"
              help="The wallet that can claim the bootstrapped liquidity"
              label="Beneficiary"
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

            <FormControlWithError
              id="startPrice"
              help="The starting price for this token. You should set this a little above the expected price of the token. Prices will fall to the fair price. Note that if there's enough demand, they can also increase from this price."
              label="Starting Price"
              errors={errors}
            >
              <Input
                type="number"
                min={0}
                step={0.000000000001}
                {...register("startPrice")}
              />
            </FormControlWithError>
            <FormControlWithError
              id="minPrice"
              help="The minimum possible price for this token, if nobody buys during the bootstrapping interval. The wider the range between starting price and minimum price, the more rapidly the price will fall. It is reccommended to keep these numbers within 5x of each other."
              label="Minimum Price"
              errors={errors}
            >
              <Input
                type="number"
                min={0}
                step={0.000000000001}
                {...register("minPrice")}
              />
            </FormControlWithError>
            <TokenIntervalInputs />
            <FormControlWithError
              id="mintCap"
              help={
                useCandyMachine
                  ? "The number of items that will be sold in the dynamic pricing mint. This should not exceed the number of items remaining in the candymachine at the time dynamic pricing begins. Note that, depending on the above parameters this may not mint out"
                  : "The number of tokens to mint. Note that, depending on the above parameters this liqudity bootstrapping may not sell out"
              }
              label="Number of Tokens"
              errors={errors}
            >
              <Input
                type="number"
                min={0}
                step={0.000000000001}
                {...register("mintCap")}
              />
            </FormControlWithError>

            {!useCandyMachine && (
              <FormControlWithError
                id="sellFrozen"
                help="Disable selling of tokens back to the LBC. Allowing users to sell back to the LBC can aid in price discovery."
                label="Disable Selling"
                errors={errors}
              >
                <Switch {...register("sellFrozen")} />
              </FormControlWithError>
            )}

            <FormControlWithError
              id="goLiveDate"
              help="The time this LBC will go live, in your browser's local timezone"
              label="Launch Date"
              errors={errors}
            >
              <Input type="datetime-local" {...register("goLiveDate")} />
            </FormControlWithError>

            <Disclosures fees={LBC_CURVE_FEES} />

            {useCandyMachine && (
              <FormControlWithError
                id="convertCandyMachine"
                help="Convert this Candy Machine to use dynamic pricing? If you are running a whitelist mint, you can do this at a later date on the following page."
                label="Convert CandyMachine to Dynamic Pricing?"
                errors={errors}
              >
                <Switch
                  isChecked={convertCandyMachine}
                  {...register("convertCandyMachine")}
                />
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
              Create LBC
            </Button>
          </VStack>
        </form>
      </FormProvider>
    </Flex>
  );
};
