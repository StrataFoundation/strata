import { SITE_URL } from "./constants";

const defaultSeo = {
  title: "Strata Protocol",
  description:
    "Strata Protocol enables anyone to launch tokens on Solana around a person, project, idea, or collective in minutes",
  openGraph: {
    url: SITE_URL,
    title: "Strata Protocol",
    description:
      "Strata Protocol enables anyone to launch tokens on Solana around a person, project, idea, or collective in minutes.",
    images: [
      {
        url: `${SITE_URL}/seoDefaultCardImage.jpg`,
        width: 800,
        height: 600,
        alt: "Solana Social Tokens",
        type: "image/jpeg",
      },
    ],
    site_name: "StrataProtocol",
  },
  twitter: {
    handle: "@StrataProtocol",
    site: SITE_URL,
    cardType: "summary_large_image",
  },
};

export default defaultSeo;
