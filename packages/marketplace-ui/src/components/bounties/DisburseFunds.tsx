import { Box, Button, FormLabel, Icon, VStack } from "@chakra-ui/react";
import { serializeInstructionToBase64 } from "@solana/spl-governance";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { MarketplaceSdk } from "@strata-foundation/marketplace-sdk";
import {
  Notification,
  useGovernance,
  usePublicKey,
  useReserveAmount, useTokenBonding,
  useTokenRef
} from "@strata-foundation/react";
import { InstructionResult } from "@strata-foundation/spl-utils";
import React, { useState } from "react";
import { useAsync } from "react-async-hook";
import toast from "react-hot-toast";
import { BsClipboard } from "react-icons/bs";
import { useIsBountyAdmin } from "../../hooks/useIsBountyAdmin";
import { useMarketplaceSdk } from "../../contexts/marketplaceSdkContext";
import { AsyncButton } from "../AsyncButton";
import { Recipient } from "../form/Recipient";

async function getInstructions(
  marketplaceSdk: MarketplaceSdk | undefined,
  reserveAmount: number | undefined,
  tokenBondingKey: PublicKey,
  address: PublicKey | undefined
): Promise<InstructionResult<null> | undefined> {
  if (marketplaceSdk && address && reserveAmount) {
    return marketplaceSdk?.disburseBountyInstructions({
      destination: address,
      tokenBonding: tokenBondingKey,
    });
  }
}

export const DisburseFunds = ({
  tokenBondingKey,
}: {
  tokenBondingKey: PublicKey;
}) => {
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
  ]);

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
            colorScheme="primary"
            w="full"
            action={async () => {
              if (marketplaceSdk) {
                await marketplaceSdk.disburseBounty({
                  tokenBonding: tokenBondingKey,
                  destination: new PublicKey(address),
                });
              }
            }}
          >
            Disburse
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
