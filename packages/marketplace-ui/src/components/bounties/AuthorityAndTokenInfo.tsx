import React from "react";
import { SimpleGrid, HStack, Text, Spinner } from "@chakra-ui/react";
import { Creator, OnCreatorClick, usePublicKey, useTokenBondingFromMint, useTokenMetadata } from "@strata-foundation/react";
import { PublicKey } from "@solana/web3.js";

const onCreatorClick: OnCreatorClick = (c, t, tokenRef, handle) => {
  window.open(
    tokenRef
      ? `https://wum.bo/app/profile/view/${tokenRef.mint}`
      : handle
      ? `https://twitter.com/${handle}`
      : `https://explorer.solana.com/address/${c.toBase58()}`,
    "_blank"
  );
};

export const InfoItem = ({ name, creator, loading }: { name: string, loading: boolean, creator: PublicKey | undefined }) => {
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
          onClick={onCreatorClick}
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
    <HStack justify="center" gap={1} flexWrap="wrap" fontSize="14px" spacing={4}>
      <InfoItem creator={updateAuthority} loading={loading} name="Requester" />
      <InfoItem
        creator={tokenBonding?.reserveAuthority as PublicKey}
        loading={loading}
        name="Approver"
      />
    </HStack>
  );
};
