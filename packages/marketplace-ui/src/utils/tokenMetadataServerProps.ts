import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey } from "@solana/web3.js";
import { GetServerSideProps } from "next";

export const mintMetadataServerSideProps: GetServerSideProps = async (
  context
) => {
  const apollo = new ApolloClient({
    uri: "https://graph.holaplex.com/v1",
    cache: new InMemoryCache(),
  });

  const address = (
    await Metadata.getPDA(new PublicKey(context.params?.mintKey as string))
  ).toBase58();
  const result = await apollo.query<{ nft: { name: string, description: string, image: string} }>({
    query: gql`
      query GetUrl($address: String!) {
        nft(address: $address) {
          name
          description
          image
        }
      }
    `,
    variables: {
      address,
    },
  });

  const { name, description, image } = (result.data?.nft || {});

  return {
    props: {
      name: name || null,
      description: description || null,
      image: image || null,
    },
  };
};
