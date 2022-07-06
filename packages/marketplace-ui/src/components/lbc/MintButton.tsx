import {
  Button,
  Collapse,
  Flex,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  LightMode,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  Notification,
  useBondingPricing,
  useCapInfo,
  useErrorHandler,
  useProvider,
  useStrataSdks,
  useTokenBonding,
  useUserOwnedAmount,
} from "@strata-foundation/react";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import React, { useState } from "react";
import { useAsyncCallback } from "react-async-hook";
import toast from "react-hot-toast";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";
import { RiInformationLine } from "react-icons/ri";
import { useLivePrice } from "../../hooks/useLivePrice";

async function buy({
  tokenBondingSdk,
  tokenBonding,
  maxPrice,
}: IMintArgs): Promise<void> {
  if (tokenBondingSdk && tokenBonding) {
    if (isNaN(maxPrice)) {
      throw new Error("Invalid slippage");
    }
    await tokenBondingSdk.buy({
      tokenBonding,
      desiredTargetAmount: 1,
      expectedBaseAmount: maxPrice,
      slippage: 0,
    });
    toast.custom((t) => (
      <Notification
        show={t.visible}
        type="success"
        heading="Transaction Successful"
        message={`Succesfully minted! Check the collectibles section of your wallet for the token.`}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ));
  }
}

export interface IMintArgs {
  tokenBondingSdk: SplTokenBonding | undefined;
  tokenBonding: PublicKey | undefined;
  maxPrice: number;
}

export const MintButton = ({
  tokenBondingKey,
  price: inputPrice,
  isDisabled,
  disabledText,
  onMint = buy,
}: {
  tokenBondingKey?: PublicKey;
  price?: number;
  isDisabled?: boolean;
  disabledText?: string;
  onMint?: (args: IMintArgs) => Promise<void>;
}) => {
  const { connected, publicKey } = useWallet();
  const { awaitingApproval } = useProvider();
  const [slippage, setSlippage] = useState("5");
  const { numRemaining } = useCapInfo(tokenBondingKey);
  const {
    pricing,
    loading: pricingLoading,
    error: pricingError,
  } = useBondingPricing(tokenBondingKey);
  const { handleErrors } = useErrorHandler();
  const { tokenBondingSdk } = useStrataSdks();
  const { execute, loading, error } = useAsyncCallback(onMint);
  handleErrors(pricingError, error);
  const { info: tokenBonding, loading: bondingLoading } =
    useTokenBonding(tokenBondingKey);
  const { price } = useLivePrice(tokenBonding?.publicKey);
  const priceToUse = inputPrice || price;
  const targetBalance = useUserOwnedAmount(publicKey, tokenBonding?.targetMint);

  const ownedAmount = useUserOwnedAmount(publicKey, tokenBonding?.baseMint);
  const insufficientBalance = (priceToUse || 0) > (ownedAmount || 0);
  const notLive =
    tokenBonding &&
    tokenBonding.goLiveUnixTime.toNumber() > new Date().valueOf() / 1000;

  const canFinishPrevious = (targetBalance || 0) > 0;
  return (
    <VStack spacing={8} align="stretch">
      <VStack
        spacing={1}
        padding={4}
        align="stretch"
        borderColor="gray.400"
        borderWidth="1px"
        rounded="lg"
        fontSize="sm"
      >
        <Flex justify="space-between" alignItems="center">
          <HStack>
            <Text>Slippage</Text>
            <Tooltip
              placement="top"
              label="Your transaction will fail if the price changes unfavorably more than this percentage."
            >
              <Flex>
                <Icon
                  w={5}
                  h={5}
                  as={RiInformationLine}
                  _hover={{ color: "primary.500", cursor: "pointer" }}
                />
              </Flex>
            </Tooltip>
          </HStack>
          <InputGroup size="sm" w="60px">
            <Input
              id="slippage"
              borderColor="gray.400"
              _hover={{ borderColor: "gray.500" }}
              textAlign="right"
              rounded="lg"
              placeholder="0"
              type="number"
              fontWeight="semibold"
              step={1}
              min={1}
              max={90}
              paddingRight={5}
              paddingLeft={1}
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
            />
            <InputRightElement
              zIndex={0}
              w={4}
              justifyContent="end"
              paddingRight={1.5}
              rounded="lg"
            >
              <Text margin={0}>%</Text>
            </InputRightElement>
          </InputGroup>
        </Flex>
      </VStack>
      <LightMode>
        <Button
          onClick={() =>
            execute({
              tokenBondingSdk,
              tokenBonding: tokenBondingKey,
              maxPrice: priceToUse! * (1 + Number(slippage) / 100),
            })
          }
          isLoading={bondingLoading || pricingLoading || loading}
          colorScheme="primary"
          isDisabled={
            (numRemaining == 0 && !targetBalance) ||
            ((targetBalance || 0) === 0 && insufficientBalance) ||
            notLive ||
            (!canFinishPrevious && isDisabled)
          }
          loadingText={
            awaitingApproval
              ? "Awaiting Approval"
              : loading
              ? "Submitting"
              : "Loading"
          }
        >
          {canFinishPrevious
            ? "Finish previous Mint Transaction"
            : numRemaining == 0
            ? "Sold Out"
            : insufficientBalance
            ? "Insufficient Balance"
            : notLive
            ? `Goes live at ${
                tokenBonding &&
                new Date(
                  tokenBonding.goLiveUnixTime.toNumber() * 1000
                ).toLocaleString()
              }`
            : isDisabled
            ? disabledText
            : connected
            ? "Mint"
            : "Connect Wallet"}
        </Button>
      </LightMode>
    </VStack>
  );
};
