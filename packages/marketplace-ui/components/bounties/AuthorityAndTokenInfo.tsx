import React from "react";
import { SimpleGrid, HStack, Text, Spinner } from "@chakra-ui/react";
import { Creator, GetCreatorLink, usePublicKey, useTokenBondingFromMint, useTokenMetadata } from "@strata-foundation/react";
import { PublicKey } from "@solana/web3.js";

const getCreatorLink: GetCreatorLink = (c, t, tokenRef, handle) => {
  return tokenRef
    ? `https://wum.bo/profile/${tokenRef.mint}`
    : handle
    ? `https://twitter.com/${handle}`
    : `https://explorer.solana.com/address/${c.toBase58()}`;
};
const InfoItem = ({ name, creator, loading }: { name: string, loading: boolean, creator: PublicKey | undefined }) => {
  return (
    <HStack spacing={2}>
      <Text fontWeight={800} color="gray.700">
        {name}:{" "}
      </Text>{" "}
      {loading ? (
        <Spinner size="xs" />
      ) : creator ? (
        <Creator
          creator={creator}
          getCreatorLink={getCreatorLink}
        />
      ) : "None"}
    </HStack>
  );
}

export const AuthorityAndTokenInfo = ({ mintKey }: { mintKey: PublicKey | undefined }) => {
  const { info: tokenBonding, loading } = useTokenBondingFromMint(mintKey);
  const { metadata, loading: loadingMeta } = useTokenMetadata(mintKey);
  const updateAuthority = usePublicKey(metadata?.updateAuthority);
  return (
    <SimpleGrid columns={[1, 1, 2]} fontSize="14px" spacing={4}>
      <InfoItem creator={updateAuthority} loading={loading} name="Requester" />
      <InfoItem
        creator={tokenBonding?.reserveAuthority as PublicKey}
        loading={loading}
        name="Approver"
      />
    </SimpleGrid>
  );
};
