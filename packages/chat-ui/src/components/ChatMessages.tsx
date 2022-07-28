import { Skeleton, SkeletonCircle } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import throttle from "lodash/throttle";
import { MemodMessage } from "./message";
import { Flex } from "./MyFlex";
import { useAsyncCallback } from "react-async-hook";
import { sleep } from "@strata-foundation/spl-utils";
import {
  IMessageWithPending,
  IMessageWithPendingAndReacts,
} from "../hooks/useMessages";

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
  isLoadingMore,
  hasMore,
  fetchMore = () => null,
  scrollRef,
  messages = [],
}: {
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  fetchMore: (num: number) => void;
  scrollRef?: any;
  messages?: (IMessageWithPendingAndReacts | IMessageWithPending)[];
}) => {
  const myScrollRef = useRef(null);
  if (!scrollRef) scrollRef = myScrollRef;

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

  const handleOnScroll = useCallback(
    throttle((e: any) => {
      const scrollOffset = e.target.scrollHeight + e.target.scrollTop;

      if (
        scrollOffset <= e.target.offsetHeight + INFINITE_SCROLL_THRESHOLD &&
        !isLoadingMore &&
        hasMore
      ) {
        fetchMore(FETCH_COUNT);
      }
    }, 300),
    [isLoadingMore, fetchMore, hasMore]
  );

  const loaders = useMemo(() => {
    return !messages.length ? (
      Array.from(Array(FETCH_COUNT).keys()).map((x, index) => (
        <ChatMessageSkeleton key={`skeleton-${index}`} />
      ))
    ) : (
      <ChatMessageSkeleton />
    );
  }, [messages.length]);

  const { execute: scrollToMessage } = useAsyncCallback(async function (
    id: string
  ) {
    // listen to escape key press to break loop
    let breakLoop = false;
    function keyPress(e: any) {
      if (e.key === "Escape") {
        breakLoop = true;
      }
    }
    document.addEventListener("keypress", keyPress);
    while (!breakLoop && hasMore && scrollRef.current) {
      let findElem = document.getElementById(id as string);
      if (findElem) {
        findElem.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      // scroll to the top which should load more messages
      scrollRef.current.scroll({
        top: -scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
      await sleep(300);
    }
    document.removeEventListener("keypress", keyPress);
  });

  return (
    <Flex
      grow={1}
      overflowY="auto"
      direction="column-reverse"
      ref={scrollRef}
      onScroll={handleOnScroll}
    >
      {messages?.map((msg, index) => (
        <MemodMessage
          scrollToMessage={scrollToMessage}
          key={msg?.id}
          {...msg}
          showUser={
            !(
              messages[index + 1] &&
              messages[index + 1].sender.equals(msg.sender) &&
              messages[index + 1].endBlockTime >=
                (msg.startBlockTime || new Date().valueOf() / 1000) -
                  INACTIVE_TIME
            ) || !!(msg as any).reply
          }
        />
      ))}
      {(isLoading || isLoadingMore) && loaders}
    </Flex>
  );
};
