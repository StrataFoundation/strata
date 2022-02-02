export const MetadataMeta = ({ name, description, image }: { name: string; description: string; image: string; }) => {
  return (
    <>
      <title>{name}</title>
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="og:type" content="website" />
      <meta name="description" content={description} />
      <meta property="og:title" content={name} />
      <meta property="og:image" content={image} />
      <meta property="og:description" content={description} />
      <link rel="icon" href="/favicon.ico" />

      <meta name="twitter:card" content="summary_large_image" />
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