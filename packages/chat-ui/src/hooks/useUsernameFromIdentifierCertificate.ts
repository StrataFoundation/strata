import { PublicKey } from "@solana/web3.js";
import { useTokenMetadata } from "@strata-foundation/react";

export function useUsernameFromIdentifierCertificate(identifierCertificateMint?: PublicKey): { loading: boolean; username?: string } {
  const { metadata, loading } = useTokenMetadata(identifierCertificateMint);
  const username = metadata?.data.name.split(".")[0];

  return {
    loading,
    username
  }
}