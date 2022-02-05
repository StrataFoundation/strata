import { Provider } from "@project-serum/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { GetServerSideProps } from "next";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { DEFAULT_ENDPOINT } from "@/components/Wallet";
import { SplTokenMetadata } from "@strata-foundation/spl-utils";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";

export const mintMetadataServerSideProps: GetServerSideProps = async (
  context
) => {
  const connection = new Connection(DEFAULT_ENDPOINT);
  const provider = new Provider(
    connection,
    new NodeWallet(Keypair.generate()),
    {}
  );
  const mint = new PublicKey(context.params?.mint as string);
  const tokenMetadataSdk = await SplTokenMetadata.init(provider);
  const metadataAcc =
    (await tokenMetadataSdk.getMetadata(
      await Metadata.getPDA(mint)
    ));
  const metadata = await SplTokenMetadata.getArweaveMetadata(
    metadataAcc?.data.uri
  );

  return {
    props: {
      name: metadataAcc?.data.name || null,
      description: metadata?.description || null,
      image: (await SplTokenMetadata.getImage(metadataAcc?.data.uri)) || null,
    },
  };
};