import { PublicKey } from "@solana/web3.js";
import { useTokenMetadata } from "@strata-foundation/react";

export function useChatIdFromIdentifierCertificate(
  identifierCertificateMint?: PublicKey
): { loading: boolean; chatId?: string } {
  const { metadata, loading } = useTokenMetadata(identifierCertificateMint);
  const chatId = metadata?.data.name.split(".")[0];

  return {
    loading,
    chatId,
  };
}
