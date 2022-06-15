import { Flex } from "@chakra-ui/react";
import { IMessage } from "@strata-foundation/chat";
import React, { useEffect } from "react";
import throttle from "lodash/throttle";
import { Message } from "./Message";

const INACTIVE_TIME = 60; // After 1 minute, new grouping
const INFINITE_SCROLL_THRESHOLD = 300;

export const ChatMessages = ({
  isLoading,
  hasMore,
  fetchMore = () => null,
  scrollRef,
  messages = [],
}: {
  isLoading: boolean;
  hasMore: boolean;
  fetchMore: (num: number) => void;
  scrollRef: any;
  messages?: IMessage[];
}) => {
  useEffect(() => {
    // fetchMore initialy if hasMore
    // & no scrollBar height detected
  }, [scrollRef, hasMore, fetchMore]);

  const handleOnScroll = throttle(() => {
    if (!isLoading && hasMore) {
      console.log("fetchMore");
      // fetchMore(5);
    }
  }, 300);

  const loader = (
    <div className="loader" key={0}>
      Loading ...
    </div>
  );

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
      {isLoading && <div>Loading....</div>}
    </Flex>
  );
};
