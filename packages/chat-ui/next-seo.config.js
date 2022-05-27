import { SITE_URL } from "@/constants";

const defaultSeo = {
  title: "Strata Chat",
  description:
    "Strata Chat enables token gated chatrooms",
  openGraph: {
    url: SITE_URL,
    title: "Strata Chat",
    description:
      "Token gated chatrooms on Solana",
    images: [
      {
        url: `${SITE_URL}/seoDefaultCardImage.jpg`,
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
    site: SITE_URL,
    cardType: "summary_large_image",
  },
};

export default defaultSeo;
