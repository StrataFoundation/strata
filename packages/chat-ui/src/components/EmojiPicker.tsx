import React, { useState, useCallback, useEffect, FC, useRef } from "react";
import { Fade, useColorModeValue } from "@chakra-ui/react";
import data from "@emoji-mart/data";
import { PublicKey } from "@solana/web3.js";
import { useErrorHandler } from "@strata-foundation/react";
import { MessageType } from "@strata-foundation/chat";
import { useEmojis, useSendMessage } from "../contexts";
import { Flex } from "./MyFlex";

export const EmojiPicker: FC<any> = (props) => {
  const ref = useRef<any>();
  const showEmojis = useRef(true);

  useEffect(() => {
    if (showEmojis.current) {
      showEmojis.current = false;
      // @ts-ignore
      import("emoji-mart").then((EmojiMart) => {
        new EmojiMart.Picker({
          ...props,
          // @ts-ignore
          data,
          ref,
        });
      });
    }

    ref.current.children[0] &&
      ref.current.children[0].shadowRoot
        .querySelector('input[type="search"]')
        .focus();
  }, [props, ref]);

  return <div ref={ref} />;
};

interface IEmojiPickerPopover {
  chatKey: PublicKey | undefined;
}

export const EmojiPickerPopover: FC<IEmojiPickerPopover> = ({ chatKey }) => {
  const [emoji, setEmoji] = useState<any | undefined>();
  const { referenceMessageId, hidePicker } = useEmojis();
  const rgbBackground = useColorModeValue("243 244 246", "32 41 55");
  const rgbColor = useColorModeValue("white", "black");
  const rgbInput = useColorModeValue("255 255 255", "56 63 75");
  const colorBorder = useColorModeValue("#e4e7eb", "");
  const { handleErrors } = useErrorHandler();
  const { sendMessage, error } = useSendMessage();
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
        message: {
          type: MessageType.React,
          emoji: emoji.native,
          referenceMessageId,
        },
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
