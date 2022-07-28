import { Box, Button, FormLabel, Icon, VStack } from "@chakra-ui/react";
import { serializeInstructionToBase64 } from "@solana/spl-governance";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { MarketplaceSdk } from "@strata-foundation/marketplace-sdk";
import {
  Notification,
  useAccountFetchCache,
  useGovernance,
  usePublicKey,
  useReserveAmount, useTokenBonding,
  useTokenRef,
  useTokenSwapFromId
} from "@strata-foundation/react";
import { InstructionResult } from "@strata-foundation/spl-utils";
import React, { useMemo, useState } from "react";
import { useAsync } from "react-async-hook";
import toast from "react-hot-toast";
import { BsClipboard } from "react-icons/bs";
import { useIsBountyAdmin } from "../hooks/useIsBountyAdmin";
import { useMarketplaceSdk } from "../contexts/marketplaceSdkContext";
import { AsyncButton } from "./AsyncButton";
import { Recipient } from "./form/Recipient";

async function getInstructions(
  marketplaceSdk: MarketplaceSdk | undefined,
  reserveAmount: number | undefined,
  tokenBondingKey: PublicKey | undefined,
  address: PublicKey | undefined,
  includeRetrievalCurve: boolean | undefined,
  closeBonding: boolean | undefined,
  closeEntangler: boolean | undefined,
  parentEntangler: PublicKey | undefined,
  childEntangler: PublicKey | undefined
): Promise<InstructionResult<null> | undefined> {
  if (tokenBondingKey && marketplaceSdk && address && reserveAmount) {
    return marketplaceSdk.disburseCurveInstructions({
      destinationWallet: address,
      tokenBonding: tokenBondingKey,
      includeRetrievalCurve,
      closeBonding,
      closeEntangler,
      childEntangler,
      parentEntangler
    });
  }
}

export const DisburseFunds = ({
  tokenBondingKey: inputTokenBondingKey,
  id,
  includeRetrievalCurve = false,
  closeBonding = false,
  closeEntangler = false,
}: {
  tokenBondingKey?: PublicKey;
  /** Id could either be a child entangler or target mint */
  id?: PublicKey;
  includeRetrievalCurve?: boolean;
  closeBonding?: boolean;
  closeEntangler?: boolean;
}) => {
  const {
    tokenBonding: swapBonding,
    parentEntangler,
    childEntangler,
  } = useTokenSwapFromId(id);
  const tokenBondingKey = useMemo(
    () => swapBonding?.publicKey || inputTokenBondingKey,
    [inputTokenBondingKey?.toBase58(), swapBonding]
  );
  const [address, setAddress] = useState("");
  const { marketplaceSdk } = useMarketplaceSdk();
  const reserveAmount = useReserveAmount(tokenBondingKey);
  const { publicKey } = useWallet();
  const { info: tokenBonding, loading: bondingLoading } =
    useTokenBonding(tokenBondingKey);
  const addressKey = usePublicKey(address);
  const { info: governance, loading: governanceLoading } = useGovernance(
    tokenBonding?.reserveAuthority as PublicKey | undefined
  );
  const { result: instructionResult, loading } = useAsync(getInstructions, [
    marketplaceSdk,
    reserveAmount,
    tokenBondingKey,
    addressKey,
    includeRetrievalCurve,
    closeBonding,
    closeEntangler,
    parentEntangler?.publicKey,
    childEntangler?.publicKey
  ]);

  const cache = useAccountFetchCache();
  const { isAdmin } = useIsBountyAdmin(publicKey || undefined, tokenBondingKey);

  if (isAdmin && tokenBonding) {
    return (
      <Box w="full">
        <FormLabel htmlFor="recipient">Recipient</FormLabel>
        {publicKey && (
          <Button
            variant="link"
            onClick={() => setAddress(publicKey.toBase58())}
          >
            Set to My Wallet
          </Button>
        )}
        <Recipient
          name="recipient"
          value={address}
          onChange={(e) => {
            // @ts-ignore
            setAddress(e.target.value);
          }}
        />
        {!governance && (
          <AsyncButton
            mt={4}
            isLoading={bondingLoading || governanceLoading}
            variant="outline"
            colorScheme={closeBonding ? "red" : "primary"}
            w="full"
            action={async () => {
              if (marketplaceSdk) {
                await marketplaceSdk.disburseCurve({
                  parentEntangler: parentEntangler?.publicKey,
                  childEntangler: childEntangler?.publicKey,
                  closeEntangler,
                  closeBonding,
                  tokenBonding: tokenBondingKey!,
                  destinationWallet: new PublicKey(address),
                  includeRetrievalCurve,
                });
              }
            }}
          >
            {closeBonding ? "Disburse and Close" : "Disburse"}
          </AsyncButton>
        )}
        <VStack spacing={2} align="flex-start">
          {governance &&
            instructionResult &&
            instructionResult.instructions.map((i, index) => (
              <Button
                key={index}
                variant="outline"
                colorScheme="primary"
                leftIcon={<Icon as={BsClipboard} />}
                onClick={() => {
                  const ixData = serializeInstructionToBase64(i);
                  navigator.clipboard.writeText(ixData);
                  toast.custom((t) => (
                    <Notification
                      show={t.visible}
                      type="info"
                      heading="Copied to Clipboard"
                      message={ixData}
                      onDismiss={() => toast.dismiss(t.id)}
                    />
                  ));
                }}
              >
                Instruction {index + 1}
              </Button>
            ))}
        </VStack>
      </Box>
    );
  }

  return <div />;
};
