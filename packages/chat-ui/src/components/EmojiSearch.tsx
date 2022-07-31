import { Button, HStack, IconButton, Input, VStack } from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { filterEmoji, Emoji } from "../constants/filterEmoji";

export const EmojiSearch = ({ onSelect }: { onSelect: (em: Emoji) => void }) => {
  const [search, setSearch] = useState("");
  const emojis = useMemo(() => filterEmoji(search, 10), [search]);
  const [focusIndex, setFocusIndex] = useState(0);

  useEffect(() => {
    if (emojis.length - 1 < focusIndex && emojis.length != 0) {
      setFocusIndex(emojis.length - 1);
    }
  }, [emojis]);
  return (
    <VStack w="full" justify="stretch">
      <Input
        onKeyDown={(e) => {
          if (e.key == "Enter" && emojis[focusIndex]) {
            onSelect(emojis[focusIndex]);
          } else if (e.key == "ArrowRight") {
            setFocusIndex((i) =>
              i == emojis.length - 1 ? emojis.length - 1 : i + 1
            );
          } else if (e.key == "ArrowLeft") {
            setFocusIndex((i) => (i == 0 ? 0 : i - 1));
          }
        }}
        autoFocus
        onChange={(e) => setSearch(e.target.value)}
        value={search}
        placeholder="Search..."
      />
      <HStack overflow="auto" w="full">
        {emojis.map((emoji, index) => (
          <Button
            border={focusIndex === index ? "1px solid gray" : undefined}
            variant="ghost"
            key={emoji.title}
            onClick={() => onSelect(emoji)}
            aria-label={emoji.title}
          >
            {emoji.symbol}
          </Button>
        ))}
      </HStack>
    </VStack>
  );
};
