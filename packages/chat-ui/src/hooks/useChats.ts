import { gql, useQuery } from "@apollo/client";
import { PublicKey } from "@solana/web3.js";

export interface GraphChat {
  name: string;
  publicKey: string;
  identifierCertificateMint: string;
  imageUrl: string;
  dailyActiveUsers: number;
}


const CHAT_QUERY = gql`
  query Chats($publicKeys: [String]) {
    chats(pubkeys: $publicKeys) {
      name
      publicKey
      imageUrl
      identifierCertificateMint,
      dailyActiveUsers
    }
  }
`;



export const useChats = (publicKeys?: PublicKey[]) => {
  const {
    data: { chats = [] } = {},
    error,
    loading,
  } = useQuery<{
    chats?: GraphChat[];
  }>(CHAT_QUERY, {
    variables: {
      publicKeys,
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