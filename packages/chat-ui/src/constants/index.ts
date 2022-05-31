export const SOLANA_URL =
  process.env.NEXT_PUBLIC_SOLANA_URL ||
  "https://psytrbhymqlkfrhudd.dev.genesysgo.net:8899/";

export const GA_TRACKING_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS || "G-L4QLBX3394";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY!