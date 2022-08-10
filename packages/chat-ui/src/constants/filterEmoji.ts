//@ts-ignore
import emojiList from "./emojiList.json";

export type Emoji = {
  title: string,
  symbol: string,
  keywords: string
}
export function filterEmoji(searchText: string, maxResults: number): Emoji[] {
  return emojiList
    .filter((emoji: Emoji) => {
      if (emoji.title.toLowerCase().includes(searchText.toLowerCase())) {
        return true;
      }
      if (emoji.keywords.includes(searchText)) {
        return true;
      }
      return false;
    })
    .slice(0, maxResults);
}
