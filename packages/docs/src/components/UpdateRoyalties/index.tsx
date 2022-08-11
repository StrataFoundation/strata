import React, { useEffect } from "react";
//@ts-ignore
import BrowserOnly from "@docusaurus/BrowserOnly";
import { useTokenBondingKey, useTokenSwapFromId } from "@strata-foundation/react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { RoyaltiesInputs, useMarketplaceSdk, percentOr } from "@strata-foundation/marketplace-ui";
import * as yup from "yup";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAsync, useAsyncCallback } from "react-async-hook";
import { PublicKey } from "@solana/web3.js";
import {
  Alert,
  Button,
} from "@chakra-ui/react";
import {
  useCollective,
  useProvider,
  usePublicKey,
  useTokenMetadata,
} from "@strata-foundation/react";
import {
  ITokenBondingSettings,
  SplTokenCollective,
} from "@strata-foundation/spl-token-collective";
import { useVariables } from "../../theme/Root/variables";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";


interface IUpdateRoyaltiesForm {
  sellBaseRoyaltyPercentage: number;
  buyBaseRoyaltyPercentage: number;
  sellTargetRoyaltyPercentage: number;
  buyTargetRoyaltyPercentage: number;
}


const validationSchema = yup.object({
  sellBaseRoyaltyPercentage: yup.number().required(),
  buyBaseRoyaltyPercentage: yup.number().required(),
  sellTargetRoyaltyPercentage: yup.number().required(),
  buyTargetRoyaltyPercentage: yup.number().required(),
});

async function updateRoyalties(provider: any, values: IUpdateRoyaltiesForm, tokenBondingKey: PublicKey) {
  const sdk = await SplTokenBonding.init(provider);
  await sdk.updateTokenBonding({
    tokenBonding: tokenBondingKey,
    buyBaseRoyaltyPercentage: values.buyBaseRoyaltyPercentage,
    buyTargetRoyaltyPercentage: values.buyTargetRoyaltyPercentage,
    sellBaseRoyaltyPercentage: values.sellBaseRoyaltyPercentage,
    sellTargetRoyaltyPercentage: values.sellTargetRoyaltyPercentage,
  });
}

export function UpdateRoyalties() {
  const variables = useVariables();
  const { awaitingApproval, provider } = useProvider();

  const id = usePublicKey(variables.idRaw);
  const formProps = useForm<IUpdateRoyaltiesForm>({
    resolver: yupResolver(validationSchema),
  });

  const { tokenBonding } = useTokenSwapFromId(id)
  const tb = useTokenBondingKey(id, 0);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = formProps;
  const { execute, loading, error } = useAsyncCallback(updateRoyalties);
  const { marketplaceSdk } = useMarketplaceSdk();

  const { result: collectiveKey } = useAsync(
    async () => { return SplTokenCollective.collectiveKey(new PublicKey(id!))},
    [id]
  );
  const { info: collective } = useCollective(collectiveKey && collectiveKey[0]);
  const tokenBondingSettings = collective?.config
    .claimedTokenBondingSettings as ITokenBondingSettings | undefined;
  
  const {
    metadata: baseMetadata,
    error: baseMetadataError,
    loading: baseMetadataLoading,
  } = useTokenMetadata(id);

  // const {
  //   metadata: baseMetadata,
  //   error: baseMetadataError,
  //   loading: baseMetadataLoading,
  // } = useTokenMetadata(id);
  console.log(baseMetadata?.data.symbol);
  const onSubmit = async (values: IUpdateRoyaltiesForm) => {
    await execute(provider, values, tokenBonding!.publicKey);
  };
  
  useEffect(() => {
    reset({
      buyTargetRoyaltyPercentage: percentOr(tokenBonding?.buyTargetRoyaltyPercentage, 5),
      buyBaseRoyaltyPercentage: percentOr(tokenBonding?.buyBaseRoyaltyPercentage, 0),
      sellTargetRoyaltyPercentage: percentOr(tokenBonding?.sellTargetRoyaltyPercentage, 0),
      sellBaseRoyaltyPercentage: percentOr(tokenBonding?.sellBaseRoyaltyPercentage, 0),
    });
  }, [tokenBonding])

  const { connected } = useWallet();

  if (!connected) {
    return <WalletMultiButton />;
  }
  
  return (
    <BrowserOnly fallback={<div>...</div>}>
      {() => (
        <FormProvider {...formProps}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <RoyaltiesInputs 
              symbol={"SOL"}
              baseSymbol={baseMetadata?.data.symbol}
              register={register}
              minBuyTargetRoyaltyPercentage={tokenBondingSettings?.minBuyTargetRoyaltyPercentage}
              maxBuyTargetRoyaltyPercentage={tokenBondingSettings?.maxBuyTargetRoyaltyPercentage}
              minSellTargetRoyaltyPercentage={tokenBondingSettings?.minSellTargetRoyaltyPercentage}
              maxSellTargetRoyaltyPercentage={tokenBondingSettings?.maxSellTargetRoyaltyPercentage}
              minBuyBaseRoyaltyPercentage={tokenBondingSettings?.minBuyBaseRoyaltyPercentage}
              maxBuyBaseRoyaltyPercentage={tokenBondingSettings?.maxBuyBaseRoyaltyPercentage}
              minSellBaseRoyaltyPercentage={tokenBondingSettings?.minSellBaseRoyaltyPercentage}
              maxSellBaseRoyaltyPercentage={tokenBondingSettings?.maxSellBaseRoyaltyPercentage}
            />
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
              Update Royalties
            </Button>
          </form>
        </FormProvider>
      )}
    </BrowserOnly>
  )
}
