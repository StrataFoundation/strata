import React from "react";
import { NextSeo } from "next-seo";
import { SITE_URL } from "../constants";

export const MetadataMeta = ({
  title,
  description,
  image,
  cardType = "summary",
  url,
}: {
  title: string;
  description: string;
  image: string;
  cardType?: string;
  url: string;
}) => {
  return (
    <NextSeo
      title={title}
      description={description}
      openGraph={{
        url: url,
        title: title,
        description: description,
        images: [{ url: image }],
        site_name: "StrataLaunchpad",
      }}
      twitter={{
        handle: "@StrataProtocol",
        site: SITE_URL,
        cardType: cardType,
      }}
    />
  );
};
