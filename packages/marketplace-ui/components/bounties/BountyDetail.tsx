import { Button } from "@chakra-ui/react";
import {
  ButtonProps, Heading,
  Image, Input, HStack, Box,
  InputProps, Link, Spinner, Text, VStack
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  amountAsNum,
  Creator,
  useBondingPricing,
  useMint,
  useOwnedAmount,
  useStrataSdks,
  useTokenAccount,
  useTokenBonding,
  useTokenMetadata,
  roundToDecimals,
  useReserveAmount,
} from "@strata-foundation/react";
import React, { useMemo, useState } from "react";
import { AsyncButton } from "../AsyncButton";
import { DisburseFunds } from "./DisburseFunds";

export const AsyncQtyButton = ({
  inputProps = {},
  buttonProps = {},
  action,
  children,
  validate,
  all
}: {
  all?: number;
  children: React.ReactNode;
  inputProps?: InputProps;
  buttonProps?: ButtonProps;
  action: (args: { quantity: number }) => Promise<void> | undefined;
  validate?: (args: { quantity: number }) => string | null;
}) => {
  const [qty, setQty] = useState("0");
  const validation = React.useMemo(
    () => validate && validate({ quantity: Number(qty) }),
    [validate, qty]
  );

  return (
    <Box>
      <HStack>
        <Input
          type="number"
          value={qty}
          onChange={(e) => {
            setQty(e.target.value);
          }}
          {...inputProps}
        />
        {all && (
          <Button onClick={() => setQty(all.toString())} variant="link">
            All
          </Button>
        )}
      </HStack>

      <AsyncButton
        {...buttonProps}
        action={() => action({ quantity: Number(qty) })}
        isDisabled={validation ? true : false}
      >
        {validation ? validation : children}
      </AsyncButton>
    </Box>
  );
};

export const BountyDetail = ({
  name,
  description,
  image,
  tokenBondingKey,
}: {
  tokenBondingKey?: PublicKey;
  name: string;
  description: string;
  image: string;
}) => {
  const { info: tokenBonding, loading: bondingLoading } =
    useTokenBonding(tokenBondingKey);
  const { connected, publicKey } = useWallet();
  const targetMint = useMint(tokenBonding?.targetMint);
  const {
    image: targetImage,
    metadata: targetMetadata,
    data: targetData,
    loading: targetMetaLoading,
  } = useTokenMetadata(tokenBonding?.targetMint);
  const { metadata: baseMetadata, loading: metadataLoading } = useTokenMetadata(
    tokenBonding?.baseMint
  );
  const { pricing, loading: pricingLoading } =
    useBondingPricing(tokenBondingKey);
  const { tokenBondingSdk } = useStrataSdks();
  const targetSupplyNumber = targetMint?.supply.toNumber();
  const baseBalance = useOwnedAmount(tokenBonding?.baseMint);
  const targetBalance = useOwnedAmount(tokenBonding?.targetMint);
  const reserveAmount = useReserveAmount(tokenBondingKey);

  const attributes = React.useMemo(
    () =>
      targetData?.attributes?.reduce((acc, att) => {
        if (att.trait_type) acc[att.trait_type] = att.value; 
        return acc;
      }, {} as Record<string, string | number>),
    [targetData]
  );

  const isAdmin =
    publicKey &&
    (tokenBonding?.reserveAuthority as PublicKey | undefined)?.equals(
      publicKey
    );
  name = targetMetadata?.data.name || name;
  image = targetImage || image;
  description = targetData?.description || description;

  const dataMissing = !name && !image && !description;

  if (!metadataLoading && dataMissing) {
    return <Text>Not found</Text>;
  }

  if (dataMissing) {
    return <Spinner />;
  }

  return (
    <VStack p={4} align="start">
      {isAdmin && tokenBondingKey && (
        <DisburseFunds tokenBondingKey={tokenBondingKey} />
      )}
      <Image alt={name} w="full" src={image} />
      <Heading>{name}</Heading>
      <b>Current Bounty: </b>
      <Text>
        {typeof reserveAmount != "undefined" ? (
          roundToDecimals(reserveAmount, 4)
        ) : (
          <Spinner size="xs" />
        )}{" "}
        {baseMetadata?.data.symbol}
      </Text>
      <b>My Contribution:</b>
      {pricing && typeof targetBalance != "undefined" ? (
        <Text>
          {roundToDecimals(pricing.sellTargetAmount(targetBalance), 4)}{" "}
          {baseMetadata?.data.symbol}
        </Text>
      ) : (
        <Spinner size="xs" />
      )}
      <b>Authority: </b>
      {(bondingLoading || !tokenBonding) ? (
        "Loading"
      ) : (
        <Creator
          creator={tokenBonding!.reserveAuthority as PublicKey}
          getCreatorLink={(c, t, tokenRef, handle) => {
            return tokenRef
              ? `https://wum.bo/profile/${tokenRef.mint}`
              : handle
              ? `https://twitter.com/${handle}`
              : `https://explorer.solana.com/address/${c.toBase58()}`;
          }}
        />
      )}
      <Text whiteSpace="pre-line">{description}</Text>
      <b>Contact:</b> <Text whiteSpace="pre-line">{attributes?.contact}</Text>
      <b>Discussion:</b>{" "}
      <Link href={attributes?.discussion.toString()}>
        {attributes?.discussion}
      </Link>
      <VStack align="left">
        Hello
        <AsyncQtyButton
          all={baseBalance}
          validate={({ quantity }) => {
            if (!baseBalance || baseBalance < quantity) {
              return "Insufficient funds";
            }

            if (!connected) {
              return "Connect Wallet";
            }

            return null;
          }}
          action={({ quantity }) =>
            tokenBondingSdk?.buy({
              baseAmount: quantity,
              tokenBonding: tokenBondingKey!,
              slippage: 0,
            })
          }
        >
          Deposit {baseMetadata?.data.symbol}
        </AsyncQtyButton>
        <AsyncQtyButton
          all={
            pricing &&
            targetBalance &&
            -pricing.buyWithBaseAmount(-targetBalance)
          }
          validate={({ quantity }) => {
            if (pricing) {
              const actualQuantity = -pricing.buyWithBaseAmount(-quantity);
              if (!targetBalance || targetBalance < actualQuantity) {
                return "Insufficient bounty tokens";
              }

              if (!connected) {
                return "Connect Wallet";
              }
            }

            return null;
          }}
          action={({ quantity }) => {
            return (
              pricing &&
              tokenBondingSdk?.sell({
                targetAmount: -pricing.buyWithBaseAmount(-quantity),
                tokenBonding: tokenBondingKey!,
                slippage: 0,
              })
            );
          }}
        >
          Withdraw {baseMetadata?.data.symbol}
        </AsyncQtyButton>
      </VStack>
    </VStack>
  );
};
