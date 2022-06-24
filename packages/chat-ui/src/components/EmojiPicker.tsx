import React, { useRef } from "react";
import { Flex, Box } from "@chakra-ui/react";
import { PickerProps } from "emoji-mart";
import data from "@emoji-mart/data";
import { useEmojis } from "../contexts";

export const EmojiPicker: React.FC<PickerProps> = (props) => {
  const ref = useRef<HTMLDivElement>(null);
  const { referenceMessageId, hidePicker } = useEmojis();

  import("emoji-mart").then(
    ({ Picker }) =>
      new Picker({
        ...props,
        data,
        ref,
      })
  );

  return (
    <Flex position="relative" top="0" w="full" justifyContent="right">
      {referenceMessageId && <div ref={ref} />}
    </Flex>
  );
};
