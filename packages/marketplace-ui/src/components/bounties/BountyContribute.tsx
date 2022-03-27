import {
  Button,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  VStack
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  useBondingPricing,
  useOwnedAmount,
  useStrataSdks,
  useTokenBondingFromMint,
  useTokenMetadata
} from "@strata-foundation/react";
import React, { useMemo, useState } from "react";
import { AsyncButton } from "..";

export const BountyContribute = ({
  mintKey,
  onContributeSuccess,
  onBuyMore,
}: {
  mintKey: PublicKey | undefined;
  onContributeSuccess: () => void;
  onBuyMore?: (baseMint: PublicKey) => void;
}) => {
  const [qty, setQty] = useState("");
  const { connected } = useWallet();
  const { info: tokenBonding, loading: bondingLoading } =
    useTokenBondingFromMint(mintKey);
  const { tokenBondingSdk } = useStrataSdks();
  const [isWithdraw, setIsWithdraw] = useState(false);
  const { pricing } = useBondingPricing(tokenBonding?.publicKey);
  const { metadata: baseMetadata } = useTokenMetadata(tokenBonding?.baseMint);
  const targetBalance = useOwnedAmount(tokenBonding?.targetMint);

  const baseBalance = useOwnedAmount(tokenBonding?.baseMint);
  const disabledText = useMemo(() => {
    let disabledText;
    if (typeof qty !== "undefined" && Number(qty)) {
      if (isWithdraw) {
        if (pricing) {
          const actualQuantity = -pricing.buyWithBaseAmount(-Number(qty));
          if (!targetBalance || targetBalance < actualQuantity) {
            disabledText = "Insufficient funds";
          }

          if (!connected) {
            disabledText = "Connect Wallet";
          }
        }
      } else {
        if (!baseBalance || baseBalance < Number(qty)) {
          disabledText = "Insufficient funds";
        }

        if (!connected) {
          disabledText = "Connect Wallet";
        }
      }
    }
    return disabledText;
  }, [pricing, targetBalance, qty, connected, baseBalance, isWithdraw]);

  const isDisabled = !!disabledText;

  return (
    <VStack w="full" justify="stretch" spacing={2}>
      {baseMetadata && onBuyMore && (
        <Button
          variant="link"
          size="sm"
          marginLeft="auto"
          onClick={() => onBuyMore(tokenBonding!.baseMint)}
        >
          Buy More {baseMetadata.data.symbol}{" "}
        </Button>
      )}
      <InputGroup>
        <Input
          type="number"
          value={qty}
          onChange={(e) => {
            setQty(e.target.value);
          }}
        />
        <InputRightElement
          pr={"6px"}
          fontSize="16px"
          fontWeight={700}
          color="gray.500"
          justifyContent="flex-end"
          width="120px"
        >
          {baseMetadata?.data.symbol}
        </InputRightElement>
      </InputGroup>
      <HStack justify="stretch" w="full">
        <Button
          flexGrow={1}
          onClick={() => setIsWithdraw(!isWithdraw)}
          fontWeight={400}
          variant="outline"
          colorScheme="primary"
        >
          {isWithdraw ? "Contribute Funds" : "Withdraw Funds"}
        </Button>
        <AsyncButton
          flexGrow={1}
          colorScheme="primary"
          action={async () => {
            const quantity = Number(qty);
            if (isWithdraw && pricing) {
              await tokenBondingSdk?.sell({
                targetAmount: -pricing.buyWithBaseAmount(-quantity),
                tokenBonding: tokenBonding?.publicKey!,
                slippage: 0,
              });
            } else if (!isWithdraw) {
              await tokenBondingSdk?.buy({
                baseAmount: quantity,
                tokenBonding: tokenBonding?.publicKey!,
                slippage: 0,
              });
            }

            onContributeSuccess();
          }}
          isDisabled={isDisabled}
        >
          {isDisabled
            ? disabledText
            : isWithdraw
            ? "Widthdraw Funds"
            : "Contribute Funds"}
        </AsyncButton>
      </HStack>
    </VStack>
  );
};
