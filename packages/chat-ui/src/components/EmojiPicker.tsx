import React, { useState, useCallback, useEffect, FC, useRef } from "react";
import { Flex, Fade, useColorModeValue } from "@chakra-ui/react";
import { PickerProps, BaseEmoji } from "emoji-mart";
import data from "@emoji-mart/data";
import { PublicKey } from "@solana/web3.js";
import { useErrorHandler } from "@strata-foundation/react";
import { MessageType } from "@strata-foundation/chat";
import { useEmojis } from "../contexts";
import { useSendMessage } from "../hooks";

export const EmojiPicker: FC<PickerProps> = (props) => {
  const ref = useRef<any>();
  const showEmojis = useRef(true);

  useEffect(() => {
    if (showEmojis.current) {
      showEmojis.current = false;
      import("emoji-mart").then((EmojiMart) => {
        new EmojiMart.Picker({
          ...props,
          // @ts-ignore
          data,
          ref,
        });
      });
    }
  }, [props]);

  return <div ref={ref} />;
};

interface IEmojiPickerPopover {
  chatKey: PublicKey | undefined;
}

export const EmojiPickerPopover: FC<IEmojiPickerPopover> = ({ chatKey }) => {
  const [emoji, setEmoji] = useState<BaseEmoji | undefined>();
  const { referenceMessageId, hidePicker } = useEmojis();
  const rgbBackground = useColorModeValue("243 244 246", "32 41 55");
  const rgbColor = useColorModeValue("white", "black");
  const rgbInput = useColorModeValue("255 255 255", "56 63 75");
  const colorBorder = useColorModeValue("#e4e7eb", "");
  const { handleErrors } = useErrorHandler();
  const { sendMessage, error } = useSendMessage({ chatKey });
  handleErrors(error);

  const reset = useCallback(() => {
    setEmoji(undefined);
    hidePicker();
  }, [hidePicker, setEmoji]);

  const preventClickBehavior = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (emoji) {
      sendMessage({
        type: MessageType.React,
        emoji: emoji.native,
        referenceMessageId,
      });
      reset();
    }
  }, [emoji, referenceMessageId, reset, sendMessage]);

  return (
    <Flex
      w={!!referenceMessageId ? "full" : "none"}
      h={!!referenceMessageId ? "full" : "none"}
      position="absolute"
      top="0"
      right="0"
      zIndex="1"
      justifyContent="end"
      onClick={reset}
    >
      <Fade in={!!referenceMessageId}>
        <Flex
          display={!!referenceMessageId ? "flex" : "none"}
          onClick={preventClickBehavior}
          sx={{
            "--rgb-color": rgbColor,
            "--rgb-background": rgbBackground,
            "--rgb-input": rgbInput,
            "--color-border": colorBorder,
          }}
        >
          <EmojiPicker
            // @ts-ignore
            onEmojiSelect={setEmoji}
          />
        </Flex>
      </Fade>
    </Flex>
  );
};
