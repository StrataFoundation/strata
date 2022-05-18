import React from "react";
import { DisburseFunds } from "@strata-foundation/marketplace-ui";
import { useVariables } from "../../theme/Root/variables";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import ReactShadow from "react-shadow/emotion";
import { CSSReset } from "@chakra-ui/react";

export function VariableDisburseFunds({ closeBonding }: { closeBonding: boolean }) {
  const variables = useVariables();
  const { connected } = useWallet();

  if (!connected) {
    return <WalletMultiButton />
  }
  
  return (
    <ReactShadow.div>
      <CSSReset />
      <DisburseFunds
        tokenBondingKey={variables.tokenBondingKey}
        closeBonding={closeBonding}
      />
    </ReactShadow.div>
  );
}
