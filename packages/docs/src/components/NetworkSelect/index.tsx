import React from 'react';
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { VStack, Heading, Select } from "@chakra-ui/react";
import { useEndpoint } from "@strata-foundation/react";

export const NetworkSelect = () => {
  const { cluster, setClusterOrEndpoint } = useEndpoint();

  return (
    <VStack mb={8} align="start">
      <Heading size="md">Network</Heading>
      <Select
        value={cluster}
        onChange={(e) => setClusterOrEndpoint(e.target.value)}
      >
        <option value={WalletAdapterNetwork.Devnet}>Devnet</option>
        <option value={WalletAdapterNetwork.Mainnet}>Mainnet</option>
        <option value={"localnet"}>Localnet</option>
      </Select>
    </VStack>
  );
};