import React from 'react';
import { useEndpoint } from "../../contexts/Endpoint";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";
import { VStack, Heading, Select } from "@chakra-ui/react";


export const NetworkSelect = () => {
  const { endpoint, setEndpoint } = useEndpoint();

  return (
    <VStack mb={8} align="start">
      <Heading size="md">Network</Heading>
      <Select value={endpoint} onChange={(e) => setEndpoint(e.target.value)}>
        <option value={clusterApiUrl(WalletAdapterNetwork.Devnet)}>
          Devnet
        </option>
        <option value={"https://strataprotocol.genesysgo.net"}>Mainnet</option>
        <option value="http://localhost:8899">Localnet</option>
      </Select>
    </VStack>
  );
};