import { useRef, useState, useEffect, useCallback } from "react";
import data from "@emoji-mart/data";

export const useEmojiSearch = (
  arg0: React.FormEvent<HTMLTextAreaElement> | undefined
) => {
  const searchRef = useRef();
  const [emojis, setEmojis] = useState();

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

  const search = useCallback(
    async (e: React.FormEvent<HTMLTextAreaElement>) => {
      let searchMatch;
      if ((searchMatch = getCurrentlyTypedEmoji(e))) {
        setEmojis(await (searchRef.current as any)(searchMatch as string));
      }
    },
    [searchRef, setEmojis, getCurrentlyTypedEmoji]
  );

  useEffect(() => {
    (async () => {
      let searchMatch;

      if (!searchRef.current) {
        // @ts-ignore
        const EmojiMart = await import("emoji-mart");
        await EmojiMart.init({ data });
        searchRef.current = EmojiMart.SearchIndex.search;
      }
    })();
  });

  return { emojis, getCurrentlyTypedEmoji, search };
};
