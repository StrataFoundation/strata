import React, { FC, useRef } from "react";
import { Flex } from "@chakra-ui/react";
import { PickerProps } from "emoji-mart";
import data from "@emoji-mart/data";
import { PublicKey } from "@solana/web3.js";
import { useErrorHandler } from "@strata-foundation/react";
import { MessageType } from "@strata-foundation/Chat";
import { useEmojis } from "../contexts";
import { useSendMessage } from "../hooks";

interface IEmojiPickerProps extends PickerProps {
  chatKey: PublicKey | undefined;
}

export const EmojiPicker: FC<IEmojiPickerProps> = ({ chatKey, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { referenceMessageId, hidePicker } = useEmojis();
  const { handleErrors } = useErrorHandler();
  const { sendMessage, error } = useSendMessage({ chatKey });
  handleErrors(error);

  const handleOnEmojiSelect = async (emoji: any) => {
    await hidePicker();
    sendMessage({
      type: MessageType.React,
      emoji: emoji.native,
      referenceMessageId,
    });
  };

  import("emoji-mart").then(
    ({ Picker }) =>
      new Picker({
        ...rest,
        // @ts-ignore
        data,
        ref,
        showPreview: false,
        autoFocus: true,
        onEmojiSelect: handleOnEmojiSelect,
      })
  );

  return referenceMessageId ? (
    <Flex position="fixed" right="0" w="full" justifyContent="right" zIndex="1">
      <div ref={ref} />
    </Flex>
  ) : null;
};
