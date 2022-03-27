export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://strataprotocol.com";

export const DEFAULT_SOLANA_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_API_URL || "https://api.devnet.solana.com";

export const DEFAULT_WALLET_CONNECT = true;

export const DOCS_URL =
  process.env.NEXT_PUBLIC_DOCS_URL || "https://docs.strataprotocol.com";

export const MARKETPLACE_URL =
  process.env.NEXT_PUBLIC_MARKETPLACE_URL ||
  "https://marketplace.strataprotocol.com";

export const BLOG_URL =
  process.env.NEXT_PUBLIC_BLOG_URL || "https://blog.strataprotocol.com";

export const DISCORD_INVITE_URL =
  process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/XQhCFg77WM";

export const GA_TRACKING_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS || "G-6XB3Q2M01L";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
