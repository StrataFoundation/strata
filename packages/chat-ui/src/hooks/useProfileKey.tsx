import { PublicKey } from "@solana/web3.js";
import { ChatSdk } from "@strata-foundation/chat";
import { useAsync } from "react-async-hook";

export function useProfileKey(identifierCertificateMint?: PublicKey): {
  loading: boolean;
  key: PublicKey | undefined;
} {
  const { result, loading } = useAsync(
    async (identifierCertificateMint?: string) =>
      identifierCertificateMint
        ? ChatSdk.profileKey(new PublicKey(identifierCertificateMint))
        : undefined,
    [identifierCertificateMint?.toBase58()]
  );

  return {
    loading: loading,
    key: result ? result[0] : undefined,
  };
}
