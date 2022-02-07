import {
  Box, Input, FormLabel, Button
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  useReserveAmount, useStrataSdks
} from "@strata-foundation/react";
import React, { useState } from "react";
import { AsyncButton } from "../AsyncButton";
import { Recipient } from "../form/Recipient";

export const DisburseFunds = ({ tokenBondingKey }: { tokenBondingKey: PublicKey }) => {
  const [address, setAddress] = useState("");
  const { tokenBondingSdk } = useStrataSdks();
  const reserveAmount = useReserveAmount(tokenBondingKey);
  const { publicKey } = useWallet();

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
      <AsyncButton
        mt={4}
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
            await tokenBondingSdk.sendInstructions([...i1, ...instructions], [...s1, ...signers]);
          }
        }}
      >
        Disburse
      </AsyncButton>
    </Box>
  );
};
