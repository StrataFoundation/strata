import { AnchorProvider } from "@project-serum/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { DEFAULT_ENDPOINT } from "../components/Wallet";
import { FungibleEntangler } from "@strata-foundation/fungible-entangler";
import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { GetServerSideProps } from "next";
import { getClusterAndEndpoint } from "@strata-foundation/react";

export const mintMetadataServerSideProps: GetServerSideProps = async (
  context
) => {
  const { endpoint } = getClusterAndEndpoint(
    (context.query.cluster || DEFAULT_ENDPOINT) as string
  );

  const apollo = new ApolloClient({
    uri: "https://graph.holaplex.com/v1",
    cache: new InMemoryCache(),
  });

  const connection = new Connection(endpoint, {});
  const provider = new AnchorProvider(
    connection,
    new NodeWallet(Keypair.generate()),
    {}
  );
  let mintKeyStr;
  if (context.params?.mintKey) {
    mintKeyStr = context.params?.mintKey;
  } else if (context.params?.id) {
    mintKeyStr = context.params?.id;
    const id = new PublicKey(mintKeyStr as string);
    const fungibleEntanglerSdk = await FungibleEntangler.init(provider);
    let childEntangler = await fungibleEntanglerSdk.getChildEntangler(id);
    if (childEntangler) {
      const parentEntangler = await fungibleEntanglerSdk.getParentEntangler(childEntangler.parentEntangler);
      mintKeyStr = parentEntangler?.parentMint.toString()
    }
  }
  const mint = new PublicKey(mintKeyStr as string);

  const address = (
    await Metadata.getPDA(mint)
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
