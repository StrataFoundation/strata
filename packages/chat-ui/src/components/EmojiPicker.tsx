import React, { useState, useCallback, useEffect, FC, useRef } from "react";
import { Fade, SlideFade, Flex, useColorModeValue } from "@chakra-ui/react";
import data from "@emoji-mart/data";
import { PublicKey } from "@solana/web3.js";
import { useErrorHandler } from "@strata-foundation/react";
import { MessageType } from "@strata-foundation/chat";
import { BrowserView, MobileView } from "react-device-detect";
import { useEmojis } from "../contexts/emojis";
import { useSendMessage } from "../contexts/sendMessage";

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

    if (props.hidePreview) {
      setTimeout(() => {
        ref.current.children[0] &&
          ref.current.children[0].shadowRoot
            .querySelector("#preview")
            ?.remove();
      }, 1);
    }

    if (props.autoFocus) {
      setTimeout(() => {
        ref.current.children[0] &&
          ref.current.children[0].shadowRoot
            .querySelector('input[type="search"]')
            ?.focus();
      }, 1);
    }
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
    <>
      <BrowserView>
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
                autoFocus
                hidePreview
              />
            </Flex>
          </Fade>
        </Flex>
      </BrowserView>
      <MobileView>
        <Flex
          w={!!referenceMessageId ? "full" : "none"}
          h={!!referenceMessageId ? "full" : "none"}
          position="fixed"
          top="0"
          zIndex="15"
          justifyContent="center"
        >
          <SlideFade in={!!referenceMessageId} offsetY="30px">
            <Flex
              display={!!referenceMessageId ? "flex" : "none"}
              onClick={reset}
              zIndex="15"
              w="full"
              h="full"
              justifyContent="flex-end"
              alignItems="end"
              flexDirection="column"
              sx={{
                "--rgb-color": rgbColor,
                "--rgb-background": rgbBackground,
                "--rgb-input": rgbInput,
                "--color-border": colorBorder,
              }}
            >
              <Flex flexGrow={2} />
              <Flex
                w="full"
                onClick={preventClickBehavior}
                flexGrow={0}
                justifyContent="center"
              >
                <EmojiPicker
                  // @ts-ignore
                  onEmojiSelect={setEmoji}
                  hidePreview
                />
              </Flex>
            </Flex>
          </SlideFade>
        </Flex>
      </MobileView>
    </>
  );
};
