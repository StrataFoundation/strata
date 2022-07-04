import { CloseButton, Text, TextProps } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useReply } from "@/contexts/reply";
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

  const router = useRouter();
  const { id } = router.query;
  const { chatKey } = useChatKeyFromIdentifier(id as string | undefined);
  const { messages, error } =
    useMessages(chatKey, true, 25);

  const { handleErrors } = useErrorHandler();
  handleErrors(error);

  const profileKey = useMemo(() => {
    if (!messages || !replyToMessageId) return
    for (let message of messages) {
      if (message.id == replyToMessageId) {
        return message.profileKey
      }
    }
    return null;
  }, [replyToMessageId, messages])
  return <ReplyBarWithProfile profileKey={profileKey} />
}
