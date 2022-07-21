import { CloseButton, Text } from "@chakra-ui/react";
import { truncatePubkey } from "@strata-foundation/react";
import React, { useMemo } from "react";
import { useReply } from "../../contexts";
import {
  useUsernameFromIdentifierCertificate,
  useWalletProfile,
} from "../../hooks";

export function ReplyBar() {
  const { replyMessage, hideReply } = useReply();
  const { info: profile } = useWalletProfile(replyMessage?.sender);
  const { username } = useUsernameFromIdentifierCertificate(
    profile?.identifierCertificateMint,
    replyMessage?.sender
  );
  const name = useMemo(
    () =>
      username || (replyMessage?.sender && truncatePubkey(replyMessage.sender)),
    [username, profile, replyMessage]
  );

  if (!replyMessage) {
    return null;
  }

  return (
    <Text display="flex" alignItems="center">
      Replying to {name}
      <CloseButton
        color="gray.400"
        _hover={{ color: "gray.600", cursor: "pointer" }}
        onClick={hideReply}
      />
    </Text>
  );
}
