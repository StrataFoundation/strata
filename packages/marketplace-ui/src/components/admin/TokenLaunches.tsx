import {
  Text,
  Flex,
  Box
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { truthy, useFungibleChildEntangler, useStrataSdks, useTokenBondingFromMint } from "@strata-foundation/react";
import { LaunchPreview } from "./LaunchPreview";
import React, { useEffect, useMemo, useState } from 'react';
import { useWallet } from "@solana/wallet-adapter-react";
import { useAsync } from "react-async-hook";
import { FungibleEntangler } from "@strata-foundation/fungible-entangler";

interface TokenPreviewProps {
  mintKey: PublicKey | undefined;
  name: string | undefined;
  image: string | undefined;
}

export const TokenLaunches = ({ mintKey, name, image }: TokenPreviewProps) => {
  const { publicKey } = useWallet();
  const [parsed, setParsed] = useState<PublicKey[]>([]);
  const { fungibleEntanglerSdk } = useStrataSdks();
  const { info: tokenBonding } = useTokenBondingFromMint(mintKey);
  const { info: entangler } = useFungibleChildEntangler(parsed[0]);
  useAsync(async () => {
    if (!mintKey || !fungibleEntanglerSdk) return
    const parentAccounts = await fungibleEntanglerSdk?.provider.connection.getProgramAccounts(FungibleEntangler.ID,
      {
        filters: [
          {
            memcmp: {
              offset: 8,
              bytes: mintKey?.toBase58() || "",
            },
          },
        ]
      }
    );
    if (parentAccounts && parentAccounts.length) {
      const parsedParents = parentAccounts.map((acc) => {
        return fungibleEntanglerSdk?.parentEntanglerDecoder(acc.pubkey, acc.account)!;
      }).filter((acc) => {
        return acc?.authority?.equals(publicKey!)
      });

      const parsed = await Promise.all(parsedParents.map(async (acc) => {
        const childEntanglers = await fungibleEntanglerSdk?.provider.connection.getProgramAccounts(FungibleEntangler.ID,
          {
            filters: [
              {
                memcmp: {
                  offset: 8,
                  bytes: acc.publicKey.toString() || "",
                }
              }
            ]
          }
        )
        return childEntanglers?.map((child) => child.pubkey).filter(truthy)
      }))
      if (parsed[0]) {
        setParsed(parsed[0]);
      }
      return;
    }
    setParsed([]);
  }, [mintKey, fungibleEntanglerSdk, entangler]);
  

  return (
    <Box w="full">
      {tokenBonding ? (
        <Flex bgColor="white" borderRadius="8px" w="full" h="7em">
          <LaunchPreview id={mintKey!} name={name} image={image}/>
        </Flex>
      ) : parsed.length ? (
        parsed.map((val) => (
          <Flex bgColor="white" borderRadius="8px" w="full" h="7em" mb="15px" key={val.toString()}>
            <LaunchPreview id={val} name={name} image={image} />
          </Flex>
        ))
      ) : (
        <Flex bgColor="white" borderRadius="8px" w="full" h="7em">
          <Text alignSelf="center" ml="20px">No current token offerings.</Text>
        </Flex>
      )}
    </Box>
    

  );
};
  