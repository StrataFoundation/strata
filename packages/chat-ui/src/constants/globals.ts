export const SOLANA_URL =
  process.env.NEXT_PUBLIC_SOLANA_URL || "https://devnet.genesysgo.net/";

export const GA_TRACKING_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS || "G-M3SKCH92NY";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY!;
export const VISIBLE_CHATS = ["solana", "open"];
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
export const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL;
