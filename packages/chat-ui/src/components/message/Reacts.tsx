import {
  Button,
  HStack,
  Icon,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  TextProps,
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { truncatePubkey, useErrorHandler } from "@strata-foundation/react";
import React from "react";
import { MdOutlineAddReaction } from "react-icons/md";
import { IMessageWithPending } from "../../hooks/useMessages";
import { useInflatedReacts } from "../../hooks/useInflatedReacts";
import { useWalletProfile } from "../../hooks/useWalletProfile";
import { useUsernameFromIdentifierCertificate } from "../../hooks/useUsernameFromIdentifierCertificate";

const MAX_MENTIONS_DISPLAY = 3;

function ProfileName({ sender }: { sender: PublicKey } & TextProps) {
  const { info: profile } = useWalletProfile(sender);
  const { username } = useUsernameFromIdentifierCertificate(
    profile?.identifierCertificateMint,
    sender
  );
  const name = username || (sender && truncatePubkey(sender));

  return <Text>{name} </Text>;
}

export function Reacts({
  reacts,
  onReact,
  onAddReaction,
}: {
  reacts: IMessageWithPending[];
  onReact: (emoji: string, mint: boolean) => void;
  onAddReaction: () => void;
}) {
  const {
    reacts: inflatedReacts,
    error: reactError,
    loading: reactsLoading,
  } = useInflatedReacts(reacts);
  const { handleErrors } = useErrorHandler();
  handleErrors(reactError);

  if (inflatedReacts && inflatedReacts.length > 0) {
    return (
      <HStack mt={2} pt={1}>
        {inflatedReacts.map(({ emoji, messages, mine }) => (
          <Popover matchWidth trigger="hover" key={emoji}>
            {/* @ts-ignore */}
            <PopoverTrigger>
              <Button
                onClick={() => onReact(emoji, mine)}
                borderLeftRadius="20px"
                width="55px"
                borderRightRadius="20px"
                p={0}
                variant={mine ? "solid" : "outline"}
                size="sm"
                key={emoji}
              >
                <HStack spacing={1}>
                  <Text lineHeight={0} fontSize="lg">
                    {emoji}
                  </Text>
                  <Text lineHeight={0} fontSize="sm">
                    {messages.length}
                  </Text>
                </HStack>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              width="fit-content"
              fontSize="xs"
              borderRadius="md"
              bg="gray.200"
              border={0}
              color="black"
              py={0}
              px={0}
              _dark={{
                bg: "gray.700",
                color: "white",
              }}
            >
              <PopoverBody>
                <HStack spacing={1}>
                  {messages
                    .slice(0, MAX_MENTIONS_DISPLAY)
                    .map((message, index) => (
                      <HStack key={message.id} spacing={0}>
                        <ProfileName sender={message.sender} />
                        {messages.length - 1 != index && <Text>, </Text>}
                      </HStack>
                    ))}
                  {messages.length > MAX_MENTIONS_DISPLAY && (
                    <Text>
                      and {messages.length - MAX_MENTIONS_DISPLAY} others
                    </Text>
                  )}
                </HStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        ))}
        <Button
          borderLeftRadius="20px"
          width="55px"
          borderRightRadius="20px"
          variant="outline"
          size="sm"
          onClick={onAddReaction}
        >
          <Icon as={MdOutlineAddReaction} />
        </Button>
      </HStack>
    );
  }

  return <div />;
}
