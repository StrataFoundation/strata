import { gql, useQuery } from "@apollo/client";
import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";

export interface GraphChat {
  name: string;
  publicKey: string;
  identifierCertificateMint: string;
  imageUrl: string;
  metadataUrl: string;
  dailyActiveUsers: number;
}

const CHAT_QUERY = gql`
  query Chats($publicKeys: [String], $minActiveUsers: Int) {
    chats(pubkeys: $publicKeys, minActiveUsers: $minActiveUsers) {
      name
      publicKey
      imageUrl
      metadataUrl
      identifierCertificateMint
      dailyActiveUsers
    }
  }
`;

export const useChats = (publicKeys?: PublicKey[], { minActiveUsers = 2}: { minActiveUsers?: number } = {}) => {
  const strPublicKeys = useMemo(() => publicKeys?.map((p) => p.toBase58()), [publicKeys]);
  const {
    data: { chats = [] } = {},
    error,
    loading,
  } = useQuery<{
    chats?: GraphChat[];
  }>(CHAT_QUERY, {
    variables: {
      publicKeys: strPublicKeys,
      minActiveUsers
    },
    context: {
      clientName: "strata",
    },
  });
  
  return {
    error,
    loading,
    chats
  }
}