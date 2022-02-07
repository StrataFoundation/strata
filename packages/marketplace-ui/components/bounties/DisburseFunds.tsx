import {
  Box, Input, FormLabel, Button, Heading, Icon, VStack
} from "@chakra-ui/react";
import { serializeInstructionToBase64 } from "@solana/spl-governance";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  useReserveAmount,
  useStrataSdks,
  useGovernance,
  useTokenBonding,
  usePublicKey,
  Notification,
} from "@strata-foundation/react";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { InstructionResult } from "@strata-foundation/spl-utils";
import React, { useState } from "react";
import { useAsync } from "react-async-hook";
import { AsyncButton } from "../AsyncButton";
import { Recipient } from "../form/Recipient";
import { BsClipboard } from "react-icons/bs";
import toast from "react-hot-toast";

async function getInstructions(tokenBondingSdk: SplTokenBonding | undefined, reserveAmount: number | undefined, tokenBondingKey: PublicKey, address: PublicKey | undefined): Promise<InstructionResult<null> | undefined> {
   if (tokenBondingSdk && address && reserveAmount) {
    const { instructions: i1, signers: s1 } =
      await tokenBondingSdk?.transferReservesInstructions({
        amount: reserveAmount!,
        destination: address,
        tokenBonding: tokenBondingKey,
      });
    const { instructions, signers } =
      await tokenBondingSdk?.closeInstructions({
        tokenBonding: tokenBondingKey,
      });
    return { 
      instructions: [...i1, ...instructions],
      signers: [...s1, ...signers],
      output: null
    };
  }
}

export const DisburseFunds = ({ tokenBondingKey }: { tokenBondingKey: PublicKey }) => {
  const [address, setAddress] = useState("");
  const { tokenBondingSdk } = useStrataSdks();
  const reserveAmount = useReserveAmount(tokenBondingKey);
  const { publicKey } = useWallet();
  const { info: tokenBonding, loading: bondingLoading } =
    useTokenBonding(tokenBondingKey);
  const addressKey = usePublicKey(address);
  const { info: governance, loading: governanceLoading } = useGovernance(tokenBonding?.reserveAuthority as PublicKey | undefined);
  const { result: instructionResult, loading } = useAsync(getInstructions, [tokenBondingSdk, reserveAmount, tokenBondingKey, addressKey])

  return (
    <Box w="full">
      <FormLabel htmlFor="recipient">Recipient</FormLabel>
      {publicKey && (
        <Button variant="link" onClick={() => setAddress(publicKey.toBase58())}>
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
          colorScheme="orange"
          w="full"
          action={async () => {
            if (tokenBondingSdk) {
              const { instructions: i1, signers: s1 } =
                await tokenBondingSdk?.transferReservesInstructions({
                  amount: reserveAmount!,
                  destination: new PublicKey(address),
                  tokenBonding: tokenBondingKey,
                });
              const { instructions, signers } =
                await tokenBondingSdk?.closeInstructions({
                  tokenBonding: tokenBondingKey,
                });
              await tokenBondingSdk.sendInstructions(
                [...i1, ...instructions],
                [...s1, ...signers]
              );
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
              colorScheme="orange"
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
};
