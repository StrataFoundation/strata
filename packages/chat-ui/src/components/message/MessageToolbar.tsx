import { useReply } from "../../contexts/reply";
import { useEmojis } from "../../contexts/emojis";
import React, { useCallback, useMemo } from "react";
import {
  ButtonGroup,
  Flex,
  Icon,
  IconButton,
  useColorModeValue,
  Tooltip,
} from "@chakra-ui/react";
import { MdOutlineAddReaction } from "react-icons/md";
import { MdReply } from "react-icons/md";
import { IMessageWithPendingAndReacts } from "../../hooks/useMessages";

export const MessageToolbar = ({
  id: messageId,
  ...rest
}: Partial<IMessageWithPendingAndReacts>) => {
  const { showPicker } = useEmojis();
  const handleOnReaction = useCallback(() => {
    showPicker(messageId);
  }, [showPicker, messageId]);
  const highlightedBg = useColorModeValue("gray.200", "gray.800");
  const iconButtonDark = useMemo(
    () => ({
      bg: "gray.900",
      _hover: {
        bg: highlightedBg,
      },
    }),
    [highlightedBg]
  );
  const { showReply } = useReply();
  const handleOnReply = useCallback(() => {
    showReply({ id: messageId, ...rest });
  }, [showReply, messageId]);

  return (
    <Flex direction="row" justifyContent="end">
      <ButtonGroup size="lg" isAttached variant="outline">
        <Tooltip
          placement="top"
          label="Add Reaction"
          fontSize="xs"
          borderRadius="md"
          bg="gray.200"
          color="black"
          _dark={{
            bg: "gray.700",
            color: "white",
          }}
        >
          <IconButton
            borderRight="none"
            icon={<Icon as={MdOutlineAddReaction} />}
            w="32px"
            h="32px"
            variant="outline"
            size="md"
            aria-label="Add Reaction"
            bg="white"
            _dark={iconButtonDark}
            onClick={handleOnReaction}
          />
        </Tooltip>
        <Tooltip
          placement="top"
          label="Reply"
          fontSize="xs"
          borderRadius="md"
          bg="gray.200"
          color="black"
          _dark={{
            bg: "gray.700",
            color: "white",
          }}
        >
          <IconButton
            icon={<Icon as={MdReply} />}
            w="32px"
            h="32px"
            variant="outline"
            size="md"
            aria-label="Reply"
            bg="white"
            _dark={iconButtonDark}
            onClick={handleOnReply}
          />
        </Tooltip>
      </ButtonGroup>
    </Flex>
  );
};
