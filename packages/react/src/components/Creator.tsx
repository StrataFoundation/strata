import React from "react";
import { Link as PlainLink, Avatar, Text, HStack } from "@chakra-ui/react";
import { MetadataData } from "@metaplex-foundation/mpl-token-metadata";
import {
  useSocialTokenMetadata,
  useErrorHandler,
} from "../hooks";
import { ITokenRef } from "@strata-foundation/spl-token-collective";
import { Link } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { useReverseName } from "../hooks/nameService";

export const WUMBO_TWITTER_VERIFIER = new PublicKey(
  "DTok7pfUzNeNPqU3Q6foySCezPQE82eRyhX1HdhVNLVC"
);
export const WUMBO_TWITTER_TLD = new PublicKey(
  "Fhqd3ostRQQE65hzoA7xFMgT9kge2qPnsTNAKuL2yrnx"
);

export const truncatePubkey = (pkey: PublicKey): string => {
  const pkeyStr = pkey.toString();

  return `${pkeyStr.substr(0, 4)}...${pkeyStr.substr(pkeyStr.length - 4)}`;
};

export type GetCreatorLink = (
  c: PublicKey,
  t: MetadataData | undefined,
  b: ITokenRef | undefined,
  h: string | undefined
) => string;

export const Creator = React.memo(
  ({
    creator,
    getCreatorLink,
  }: {
    creator: PublicKey;
    getCreatorLink: GetCreatorLink;
  }) => {
    const { handleErrors } = useErrorHandler();
    const { metadata, tokenRef, error, image } =
      useSocialTokenMetadata(creator);

    const { nameString: handle, error: reverseTwitterError2 } = useReverseName(creator, WUMBO_TWITTER_VERIFIER, WUMBO_TWITTER_TLD);
    handleErrors(error, reverseTwitterError2);

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

    // @ts-ignore
    const link = getCreatorLink(creator, metadata, tokenRef, handle);

    if (link.includes("http")) {
      return (
        <PlainLink ml="1" mr="1" href={link}>
          {children}
        </PlainLink>
      );
    }

    return <Link to={link}>{children}</Link>;
  }
);
