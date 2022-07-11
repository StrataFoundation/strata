import React from "react";
import { DisburseFunds } from "@strata-foundation/marketplace-ui";
import { useVariables } from "../../theme/Root/variables";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import ReactShadow from "react-shadow/emotion";
import { Box, CSSReset } from "@chakra-ui/react";

export function VariableDisburseFunds({
  closeBonding = false,
  closeEntangler = false,
}: {
  closeBonding?: boolean;
  closeEntangler?: boolean;
}) {
  const variables = useVariables();
  const { connected } = useWallet();

  if (!connected) {
    return <WalletMultiButton />;
  }

  return (
    <ReactShadow.div>
      <Box mb="16px">
        <CSSReset />
        <DisburseFunds
          id={variables.id}
          tokenBondingKey={variables.tokenBondingKey}
          closeBonding={closeBonding}
          closeEntangler={closeEntangler}
        />
      </Box>
    </ReactShadow.div>
  );
}
