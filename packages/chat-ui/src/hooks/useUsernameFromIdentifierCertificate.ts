import { PublicKey } from "@solana/web3.js";
import { useAssociatedAccount, useTokenMetadata } from "@strata-foundation/react";
import { useMemo } from "react";

export function useUsernameFromIdentifierCertificate(identifierCertificateMint: PublicKey | undefined, owner: PublicKey | undefined): { loading: boolean; username?: string } {
  const { metadata, loading } = useTokenMetadata(
    identifierCertificateMint
  );
  const { associatedAccount: account } = useAssociatedAccount(owner, identifierCertificateMint);

  const username = useMemo(() => {
    if (
      account &&
      owner &&
      account.owner.equals(owner) &&
      account.amount.toNumber() >= 1
    ) {
      return metadata?.data.name.split(".")[0];
    }
  }, [owner, metadata, account]);

  return {
    loading,
    username
  }
}