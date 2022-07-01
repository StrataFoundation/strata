import { Skeleton, SkeletonCircle } from "@chakra-ui/react";
import { IMessage } from "@strata-foundation/chat";
import React, { useEffect, useMemo } from "react";
import throttle from "lodash/throttle";
import { Message } from "./Message";
import { Flex } from "./MyFlex";

const INACTIVE_TIME = 60; // After 1 minute, new grouping
const INFINITE_SCROLL_THRESHOLD = 300;
const FETCH_COUNT = 50;

export const ChatMessageSkeleton = () => (
  <Flex padding={2} gap={2}>
    <Flex>
      <SkeletonCircle size="9" />
    </Flex>
    <Flex grow={1} direction="column" gap={2}>
      <Flex gap={2}>
        <Skeleton height="8px" w="120px" />
        <Skeleton height="8px" w="60px" />
      </Flex>
      <Skeleton height="8px" w="full" />
      <Skeleton height="8px" w="full" />
    </Flex>
  </Flex>
);

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
  // On render if we dont have a scroll bar
  // and we have hasMore then fetch initialMore
  useEffect(() => {
    if (
      scrollRef.current.scrollHeight == scrollRef.current.offsetHeight &&
      hasMore &&
      !isLoading
    ) {
      fetchMore(FETCH_COUNT);
    }
  }, [scrollRef, hasMore, isLoading, fetchMore]);

  const handleOnScroll = useMemo(
    () =>
      throttle((e: any) => {
        const scrollOffset = e.target.scrollHeight + e.target.scrollTop;

        if (
          scrollOffset <= e.target.offsetHeight + INFINITE_SCROLL_THRESHOLD &&
          !isLoading &&
          hasMore
        ) {
          fetchMore(FETCH_COUNT);
        }
      }, 300),
    [isLoading, fetchMore, hasMore]
  );

  const loaders = useMemo(() => {
    return isLoading || !messages.length ? (
      !messages.length ? (
        Array.from(Array(FETCH_COUNT).keys()).map((x, index) => (
          <ChatMessageSkeleton key={`skeleton-${index}`} />
        ))
      ) : (
        <ChatMessageSkeleton />
      )
    ) : null;
  }, [messages.length, isLoading])

  return (
    <Flex
      grow={1}
      overflowY="auto"
      direction="column-reverse"
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
      {loaders}
    </Flex>
  );
};
