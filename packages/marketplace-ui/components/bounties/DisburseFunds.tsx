import {
  Box, Input
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import {
  useReserveAmount, useStrataSdks
} from "@strata-foundation/react";
import React, { useState } from "react";
import { AsyncButton } from "../AsyncButton";

export const DisburseFunds = ({ tokenBondingKey }: { tokenBondingKey: PublicKey }) => {
  const [address, setAddress] = useState("");
  const { tokenBondingSdk } = useStrataSdks();
  const reserveAmount = useReserveAmount(tokenBondingKey);

  return (
    <Box>
      <Input
        value={address}
        placeholder="Recipient"
        onChange={(e) => {
          setAddress(e.target.value);
        }}
      />

      <AsyncButton
        action={() => 
          tokenBondingSdk?.transferReserves({
            amount: reserveAmount!,
            destination: new PublicKey(tokenBondingKey),
            tokenBonding: tokenBondingKey
          })
        }
      >
        Disburse
      </AsyncButton>
    </Box>
  );
};
