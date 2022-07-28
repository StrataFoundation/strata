import {
  Text,
  Flex,
  Box
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { useErrorHandler, useTokenBondingFromMint } from "@strata-foundation/react";
import { LaunchPreview } from "./LaunchPreview";
import React, { useEffect, useMemo, useState } from 'react';
import { useWallet } from "@solana/wallet-adapter-react";
import { gql, useLazyQuery } from "@apollo/client";

const GET_PARENT_ENTANGLERS = gql`
  query GetParentEntanglers(
    $parentMint: String!
    $authority: String!
  ) {
    strata_strata {
      pid_fent99TYZcj9PGbeooaZXEMQzMd7rz8vYFiudd8HevB {
        fungible_parent_entangler(where: {parentMint: {_eq: $parentMint}, authority: {_eq: $authority}}) {
          pubkey
        }
      }
    }
  }
`;

const GET_CHILD_ENTANGLERS = gql`
  query GetChildEntanglers(
    $parentEntanglers: [String!]
  ) {
    strata_strata {
      pid_fent99TYZcj9PGbeooaZXEMQzMd7rz8vYFiudd8HevB {
        fungible_child_entangler(where: {parentEntangler: {_in: $parentEntanglers}}) {
          pubkey
        }
      }
    }
  }
`;

interface TokenPreviewProps {
  mintKey: PublicKey | undefined;
  name: string | undefined;
  image: string | undefined;
}

function unique(arr: any[]) {
  return [...new Set(arr)];
}

export const TokenLaunches = ({ mintKey, name, image }: TokenPreviewProps) => {
  const { publicKey } = useWallet();
  const [parsed, setParsed] = useState<PublicKey[]>([]);

  const { info: tokenBonding } = useTokenBondingFromMint(mintKey);
  const parentVars = useMemo(() => {
    if (mintKey && publicKey) {
      return {
        parentMint: mintKey.toString(),
        authority: publicKey.toString()
      };
    }
  }, [mintKey, publicKey]);
  const [loadParentEntanglers, { data: parentEntanglers, error: getParentsError }] = useLazyQuery<any>(GET_PARENT_ENTANGLERS, {
    variables: parentVars,
    context: {
      clientName: "vybe"
    }
  });

  const childVars = useMemo(() => {
    if (parentEntanglers) {
      const entanglers = parentEntanglers?.strata_strata[0]?.pid_fent99TYZcj9PGbeooaZXEMQzMd7rz8vYFiudd8HevB?.fungible_parent_entangler;
      const entanglerKeys = unique(entanglers.map((ent: any) => ent.pubkey));
      return {
        parentEntanglers: entanglerKeys,
      }
    }
  }, [parentEntanglers])

  const [loadChildEntanglers, { data: childEntanglers, error: getChildError }] = useLazyQuery<any>(GET_CHILD_ENTANGLERS, {
    variables: childVars,
    context: {
      clientName: "vybe"
    }
  });

  useEffect(() => {
    if (mintKey && parentVars) {
      console.log("tm2");
      console.log(parentVars);
      loadParentEntanglers({
        variables: parentVars,
        context: {
          clientName: "vybe",
        },
      });
    }
  }, [mintKey, parentVars]);

  useEffect(() => {
    if (parentEntanglers && childVars) {
      console.log("loading children");
      loadChildEntanglers({
        variables: childVars,
        context: {
          clientName: "vybe",
        },
      });
    }
  }, [parentEntanglers, childVars])

  useEffect(() => {
    if (childEntanglers) {
      const entanglers = childEntanglers?.strata_strata[0]?.pid_fent99TYZcj9PGbeooaZXEMQzMd7rz8vYFiudd8HevB?.fungible_child_entangler;
      const entanglerKeys = unique(entanglers.map((ent: any) => new PublicKey(ent.pubkey)));
      if (entanglerKeys.length) setParsed(entanglerKeys)
    }
  }, [childEntanglers])
  

  const { handleErrors } = useErrorHandler();
  handleErrors(getParentsError, getChildError);
  

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
  