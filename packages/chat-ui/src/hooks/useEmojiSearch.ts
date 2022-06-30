import { useRef, useState, useEffect, useCallback } from "react";
import data from "@emoji-mart/data";

export const useEmojiSearch = () => {
  const searchRef = useRef();
  const [emojis, setEmojis] = useState([]);
  const [searchMatch, setSearchMatch] = useState<string | null>();

  const getCurrentlyTypedEmoji = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      let match, text;

      if (
        !(match = e.currentTarget.value
          .substring(0, e.currentTarget.selectionStart)
          .match(/(^|\W):((:?\w|\+|\-)[^:]*)?$/))
      ) {
        return null;
      }

      // @ts-ignore
      text = match[0].match(/:(.*)/)[1];
      if ((text.match(RegExp(" ", "g")) || []).length > 1) {
        return null;
      }

      return text;
    },
    []
  );

  const reset = useCallback(() => {
    setEmojis([]);
    setSearchMatch(null);
  }, [setEmojis]);

  const search = useCallback(
    async (e: React.FormEvent<HTMLTextAreaElement>) => {
      let searchMatch = getCurrentlyTypedEmoji(e);
      if (searchMatch && searchMatch.length >= 2) {
        setSearchMatch(searchMatch);
        setEmojis(await (searchRef.current as any)(searchMatch as string));
      } else {
        reset();
      }
    },
    [searchRef, setEmojis, getCurrentlyTypedEmoji, reset]
  );

  useEffect(() => {
    (async () => {
      if (!searchRef.current) {
        // @ts-ignore
        const EmojiMart = await import("emoji-mart");
        // @ts-ignore
        await EmojiMart.init({ data });
        // @ts-ignore
        searchRef.current = EmojiMart.SearchIndex.search;
      }
    })();
  });

  return { emojis, searchMatch, getCurrentlyTypedEmoji, search, reset };
};
