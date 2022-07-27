import { Textarea, TextareaProps } from "@chakra-ui/react";
import React from "react";

interface IChatInputProps extends TextareaProps {
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

export const ChatInput: React.FC<IChatInputProps> = ({
  onChange,
  inputRef,
  ...rest
}) => (
  <Textarea
    ref={inputRef}
    onChange={onChange}
    resize="none"
    overflow="hidden"
    rows={1}
    px={0}
    w="full"
    h="full"
    backgroundColor="transparent"
    outline="none"
    boxShadow="none !important"
    border="none !imporatnt"
    borderColor="transparent !important"
    placeholder="GM, Say Something....."
    {...rest}
  />
);
