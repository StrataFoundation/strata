import React, { useState, useCallback, useEffect, FC, useRef } from "react";
import { Fade, Flex, useColorModeValue } from "@chakra-ui/react";
import data from "@emoji-mart/data";
import { PublicKey } from "@solana/web3.js";
import { useErrorHandler } from "@strata-foundation/react";
import { MessageType } from "@strata-foundation/chat";
import { BrowserView, MobileView } from "react-device-detect";
import { useEmojis } from "../contexts/emojis";
import { useSendMessage } from "../contexts/sendMessage";

export const EmojiPicker: FC<any> = (props) => {
  const pickerRef = useRef<any>();
  const moduleRef = useRef<any>();

  const handleDivRef = (divEl: any) => {
    pickerRef.current = divEl;
    if (!moduleRef.current) {
      moduleRef.current = import("emoji-mart").then(
        (m) =>
          new m.Picker({
            ...props,
            ref: pickerRef,
            data,
          } as any)
      );
    }
  };

  useEffect(() => {
    if (pickerRef.current && pickerRef.current.firstChild) {
      if (props.noBoxShadow) {
        pickerRef.current.firstChild.style.boxShadow = "none";
      }

      if (props.autoFocus) {
        pickerRef.current.firstChild.shadowRoot
          .querySelector('input[type="search"]')
          ?.focus();
      }
    }
  }, [props]);

  return <div ref={handleDivRef} />;
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
      {/* @ts-ignore */}
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
              <Flex bg={`rgb(${rgbBackground})`}>
                <EmojiPicker
                  // @ts-ignore
                  onEmojiSelect={setEmoji}
                  previewPosition="none"
                  searchPosition="top"
                  navPosition="bottom"
                  autoFocus={true}
                />
              </Flex>
            </Flex>
          </Fade>
        </Flex>
      </BrowserView>
      {/* @ts-ignore */}
      <MobileView>
        <Flex
          w={!!referenceMessageId ? "full" : "none"}
          h={!!referenceMessageId ? "full" : "none"}
          position="fixed"
          top="0"
          zIndex="15"
          justifyContent="center"
        >
          <Fade in={!!referenceMessageId} style={{ width: "100%" }}>
            <Flex
              display={!!referenceMessageId ? "flex" : "none"}
              onClick={reset}
              zIndex="15"
              w="full"
              h="full"
              justifyContent="flex-end"
              alignItems="end"
              flexDirection="column"
              position="absolute"
              left="0"
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
                position="absolute"
                left="0"
                bg={`rgb(${rgbBackground})`}
              >
                <EmojiPicker
                  // @ts-ignore
                  onEmojiSelect={setEmoji}
                  previewPosition="none"
                  searchPosition="top"
                  navPosition="bottom"
                  noBoxShadow
                />
              </Flex>
            </Flex>
          </Fade>
        </Flex>
      </MobileView>
    </>
  );
};
