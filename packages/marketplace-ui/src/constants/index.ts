export const SOLANA_URL =
  process.env.NEXT_PUBLIC_SOLANA_URL || "https://devnet.genesysgo.net/";

export const NFT_STORAGE_API_KEY = process.env.NEXT_PUBLIC_NFT_STORAGE_API_KEY;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000";

export const WUMBO_IDENTITY_SERVICE_URL =
  process.env.NEXT_PUBLIC_WUMBO_IDENTITY_SERVICE_URL || "http://localhost:8082";

export const GA_TRACKING_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS || "G-L4QLBX3394";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
