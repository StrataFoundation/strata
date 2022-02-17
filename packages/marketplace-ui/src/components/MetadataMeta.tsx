import React from "react";

export const MetadataMeta = ({ name, description, image, cardType = "summary" }: { name: string; description: string; image: string; cardType?: string }) => {
  return (
    <>
      <title>{name}</title>
      <meta property="og:type" content="website" />
      <meta name="description" content={description} />
      <meta property="og:title" content={name} />
      <meta property="og:image" content={image} />
      <meta property="og:description" content={description} />
      <link rel="icon" href="/favicon.ico" />

      <meta name="twitter:card" content={cardType} />
      <meta
        property="twitter:domain"
        content="marketplace.strataprotocol.com"
      />
      <meta name="twitter:title" content={name} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}