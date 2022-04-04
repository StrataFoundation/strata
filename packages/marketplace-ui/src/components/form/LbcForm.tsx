import {
  Alert,
  Box,
  Button,
  Collapse,
  Flex,
  Input,
  VStack,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { DataV2, Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { Program } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  LBC_CURVE_FEES,
  MarketplaceSdk,
} from "@strata-foundation/marketplace-sdk";
import {
  usePrimaryClaimedTokenRef,
  useProvider,
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
import { NFT_STORAGE_API_KEY } from "../../constants";
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

interface ILbpFormProps
  extends Partial<IMetadataFormProps>,
    IUseExistingMintProps {
  useCandyMachine: boolean;
  candyMachineId: string;
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
  existingMint: yup.string().when(["useExistingMint", "useCandyMachine"], {
    is: (useExistingMint: boolean, useCandyMachine: boolean) => useExistingMint && !useCandyMachine,
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

async function createLiquidityBootstrapper(
  marketplaceSdk: MarketplaceSdk,
  values: ILbpFormProps
): Promise<PublicKey> {
  const targetMintKeypair = Keypair.generate();
  const authority = new PublicKey(values.authority);
  const mint = new PublicKey(values.mint);

  let metadata;
  if (values.useExistingMint && !values.useCandyMachine) {
    const existingMint = new PublicKey(values.existingMint!);

    values.decimals = (
      await getMintInfo(marketplaceSdk.provider, existingMint)
    ).decimals;

    metadata = new DataV2({
      name: values.name || "",
      symbol: values.symbol || "",
      uri: values.uri || "",
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    });
  } else if (values.useCandyMachine) {
    metadata = new DataV2({
      // Max name len 32
      name: "Candymachine Mint Token",
      symbol: "MINT",
      uri: "",
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    });
  } else {
    const uri = await marketplaceSdk.tokenMetadataSdk.uploadMetadata({
      provider: values.provider,
      name: values.name!,
      symbol: values.symbol! || "",
      description: values.description,
      image: values.image,
      mint: targetMintKeypair.publicKey,
    });
    metadata = new DataV2({
      // Max name len 32
      name: values.name!.substring(0, 32),
      symbol: (values.symbol || "").substring(0, 10),
      uri,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    });
  }

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
    },
  });

  if (values.useExistingMint) {
    const retrievalInstrs =
      await marketplaceSdk.createRetrievalCurveForSetSupplyInstructions({
        reserveAuthority: authority,
        supplyMint: new PublicKey(values.existingMint!),
        supplyAmount: values.mintCap,
        targetMint,
      });
    instructions.push(retrievalInstrs.instructions);
    signers.push(retrievalInstrs.signers);
  }

  // Update the candymachine to use this mint
  if (values.useCandyMachine) {
    const candyMachineId = new PublicKey(values.candyMachineId);
    const incinerator = new PublicKey(
      "1nc1nerator11111111111111111111111111111111"
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
    const candymachine = await candymachineProgram.account.candyMachine.fetch(
      candyMachineId
    );
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

  return targetMint;
}

export const LbcForm: React.FC = () => {
  const formProps = useForm<ILbpFormProps>({
    resolver: yupResolver(validationSchema),
    defaultValues: { useExistingMint: true },
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = formProps;
  const { publicKey, connected } = useWallet();
  const { visible, setVisible } = useWalletModal();
  const { info: tokenRef } = usePrimaryClaimedTokenRef(publicKey);
  const { awaitingApproval } = useProvider();
  const { execute, loading, error } = useAsyncCallback(
    createLiquidityBootstrapper
  );
  const { marketplaceSdk } = useMarketplaceSdk();
  const router = useRouter();
  const { authority, mint, useExistingMint, useCandyMachine } = watch();
  useEffect(() => {
    setValue("useCandyMachine", !!router.query["candymachine"]);
  }, [router, setValue]);


  const onSubmit = async (values: ILbpFormProps) => {
    const mintKey = await execute(marketplaceSdk!, values);
    if (values.useCandyMachine) {
      router.push(
        route(routes.mintLbc, { candyMachineId: values.candyMachineId }),
        undefined,
        { shallow: true }
      );
    } else {
      router.push(
        route(routes.tokenLbc, { mintKey: mintKey.toBase58() }),
        undefined,
        { shallow: true }
      );
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
                  <FormControlWithError
                    id="decimals"
                    help="The number of of decimal places this mint will have. For example, SOL has 9 decimal places of precision. We recommend 0 if your tokens dont need to be less than 1"
                    label="Mint Decimals"
                    errors={errors}
                  >
                    <Input
                      type="number"
                      min={0}
                      step={0.000000000001}
                      {...register("decimals")}
                    />
                  </FormControlWithError>
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
            <FormControlWithError
              id="interval"
              help="The time in seconds that it will take to go from startPrice to minPrice"
              label="Interval"
              errors={errors}
            >
              <Input
                type="number"
                min={0}
                step={0.000000000001}
                {...register("interval")}
              />
            </FormControlWithError>
            <FormControlWithError
              id="mintCap"
              help="The number of tokens to mint. Note that, depending on the above parameters this liqudity bootstrapping may not sell out"
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

            <FormControlWithError
              id="goLiveDate"
              help="The time this LBC will go live, in your browser's local timezone"
              label="Launch Date"
              errors={errors}
            >
              <Input type="datetime-local" {...register("goLiveDate")} />
            </FormControlWithError>

            <Disclosures fees={LBC_CURVE_FEES} />

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
