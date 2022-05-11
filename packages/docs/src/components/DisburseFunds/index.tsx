import React from "react";
import { DisburseFunds } from "@strata-foundation/marketplace-ui";
import { useVariables } from "../../theme/Root/variables";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
export function VariableDisburseFunds() {
  const variables = useVariables();
  const { connected } = useWallet();

  if (!connected) {
    return <WalletMultiButton />
  }
  
  return <DisburseFunds tokenBondingKey={variables.tokenBondingKey} />;
}
