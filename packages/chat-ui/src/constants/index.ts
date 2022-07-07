export const SOLANA_URL =
  process.env.NEXT_PUBLIC_SOLANA_URL || "https://devnet.genesysgo.net/";

export const GA_TRACKING_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS || "G-6XB3Q2M01L";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY!;
export const VISIBLE_CHATS = ["solana", "open"];

export * from "./filterEmoji";
