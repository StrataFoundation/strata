import { Avatar, Box, Button, HStack, Link, Text } from "@chakra-ui/react";
import { MetadataData } from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey } from "@solana/web3.js";
import { ITokenRef } from "@strata-foundation/spl-token-collective";
import { useSocialTokenMetadata } from "../hooks/useSocialTokenMetadata";
import { useErrorHandler } from "../hooks/useErrorHandler";
import React from "react";
import { useReverseName } from "../hooks/nameService";
import { useGovernance } from "../hooks/useGovernance";

export const WUMBO_TWITTER_VERIFIER = new PublicKey(
  "DTok7pfUzNeNPqU3Q6foySCezPQE82eRyhX1HdhVNLVC"
);
export const WUMBO_TWITTER_TLD = new PublicKey(
  "Fhqd3ostRQQE65hzoA7xFMgT9kge2qPnsTNAKuL2yrnx"
);
// export const WUMBO_TWITTER_VERIFIER = new PublicKey(
//   "GibysS6yTqHWw4AZap416Xs26rAo9nV9HTRviKuutytp"
// );
// export const WUMBO_TWITTER_TLD = new PublicKey(
//   "EEbZHaBD4mreYS6enRqytXvXfmRESLWXXrXbtZLWyd6X"
// );

export const truncatePubkey = (pkey: PublicKey): string => {
  const pkeyStr = pkey.toString();

  return `${pkeyStr.substr(0, 4)}...${pkeyStr.substr(pkeyStr.length - 4)}`;
};

export type OnCreatorClick = (
  c: PublicKey,
  t: MetadataData | undefined,
  b: ITokenRef | undefined,
  h: string | undefined
) => void;

export const Creator = React.memo(
  ({
    creator,
    onClick
  }: {
    creator: PublicKey;
    onClick: OnCreatorClick;
  }) => {
    const { handleErrors } = useErrorHandler();
    const { metadata, tokenRef, error, image } =
      useSocialTokenMetadata(creator);

    const { nameString: handle, error: reverseTwitterError2 } = useReverseName(
      creator,
      WUMBO_TWITTER_VERIFIER,
      WUMBO_TWITTER_TLD
    );
    handleErrors(error, reverseTwitterError2);

    const { info: governance } = useGovernance(creator);

    const children = (
      <>
        {metadata && (
          <HStack spacing={1}>
            <Avatar size="xs" src={image} />
            <Text>{metadata.data.name}</Text>
          </HStack>
        )}
        {!metadata && !handle && truncatePubkey(creator)}
        {!metadata && handle && `@${handle}`}
      </>
    );

    if (governance) {
      <Link isExternal href={`https://realms.today/dao/${governance.realm.toBase58()}`}>
        {children}
      </Link>;
    }

    return (
      <Box
        _hover={{ cursor: 'pointer', textDecoration: 'underline'}}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick(creator, metadata, tokenRef, handle)
        }}
      >
        {children}
      </Box>
    );
  }
);
