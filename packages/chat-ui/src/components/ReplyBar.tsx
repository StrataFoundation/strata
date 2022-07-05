import { CloseButton, Text, TextProps } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useReply } from "../contexts";
import { useMessages, useChatKeyFromIdentifier, useProfile, useUsernameFromIdentifierCertificate } from "../hooks";
import { useRouter } from "next/router";
import { useErrorHandler } from "@strata-foundation/react";
import { PublicKey } from "@solana/web3.js";


function ReplyBarWithProfile({ profileKey }: { profileKey: PublicKey | null | undefined } & TextProps) {
  const { replyToMessageId, hideReply } = useReply();
  const { info: profile } = useProfile(profileKey);
  const { username } = useUsernameFromIdentifierCertificate(
    profile?.identifierCertificateMint
  );

  return (
    <div>
      {replyToMessageId? (
        <div>
        <Text display="flex" alignItems="center">Replying to {username}
          <CloseButton
            color="gray.400"
            _hover={{ color: "gray.600", cursor: "pointer" }}
            onClick={hideReply}
          />
        </Text>
        
        </div>
      ) : null}
    </div>
  );
}

export function ReplyBar() {
  const { replyToMessageId } = useReply();

  return <div />
  // return <ReplyBarWithProfile profileKey={profileKey} />
}
