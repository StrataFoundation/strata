import { Flex } from "@chakra-ui/react";
import { IMessage } from "@strata-foundation/chat";
import React from "react";
import throttle from "lodash/throttle";
import { Message } from "./Message";

const INACTIVE_TIME = 60; // After 1 minute, new grouping
const INFINITE_SCROLL_THRESHOLD = 300;

export const ChatMessages = ({
  isLoading,
  fetchMore = () => null,
  scrollRef,
  messages = [],
}: {
  isLoading: boolean;
  fetchMore: (num: number) => void;
  scrollRef: any;
  messages?: IMessage[];
}) => {
  const handleOnScroll = throttle((e: any) => {
    const scrollOffset = e.target.scrollHeight + e.target.scrollTop;
    if (
      scrollOffset <= e.target.offsetHeight + INFINITE_SCROLL_THRESHOLD &&
      !isLoading
    ) {
      console.log("Fetching More");
      fetchMore(50);
    }
  }, 300);

  return (
    <Flex
      grow="1"
      overflowY="auto"
      direction="column-reverse"
      h="full"
      ref={scrollRef}
      onScroll={handleOnScroll}
    >
      {messages?.map((msg, index) => (
        <Message
          key={msg?.id}
          {...msg}
          showUser={
            !(
              messages[index + 1] &&
              messages[index + 1].profileKey.equals(msg.profileKey) &&
              messages[index + 1].endBlockTime >=
                (msg.startBlockTime || new Date().valueOf() / 1000) -
                  INACTIVE_TIME
            )
          }
        />
      ))}
    </Flex>
  );
};
