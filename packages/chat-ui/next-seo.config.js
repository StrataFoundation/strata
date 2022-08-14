import { CHAT_URL } from "./src/constants/globals";

const defaultSeo = {
  title: "strata.im",
  description: "strata.im enables fully decentralized, token gated chatrooms",
  openGraph: {
    url: CHAT_URL,
    title: "strata.im",
    description: "Token gated decentralized chatrooms on Solana",
    images: [
      {
        url: `${CHAT_URL}/seoDefaultCardImage.jpg`,
        width: 800,
        height: 600,
        alt: "Og Image Alt",
        type: "image/jpeg",
      },
    ],
    site_name: "Stratachat",
  },
  twitter: {
    handle: "@StrataProtocol",
    site: CHAT_URL,
    cardType: "summary_large_image",
  },
};

export default defaultSeo;
