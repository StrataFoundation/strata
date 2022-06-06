import { Provider } from "@project-serum/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { GetServerSideProps } from "next";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { DEFAULT_ENDPOINT } from "../components/Wallet";
import { SplTokenMetadata } from "@strata-foundation/spl-utils";
import { FungibleEntangler } from "@strata-foundation/fungible-entangler";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { getClusterAndEndpoint } from "../hooks";

export const mintMetadataServerSideProps: GetServerSideProps = async (
  context
) => {
  const { endpoint } = getClusterAndEndpoint(
    (context.query.cluster || DEFAULT_ENDPOINT) as string
  );

  const connection = new Connection(endpoint, {});
  const provider = new Provider(
    connection,
    new NodeWallet(Keypair.generate()),
    {}
  );
  let mintKeyStr;
  if (context.params?.mintKey) {
    mintKeyStr = context.params?.mintKey
  } else if (context.params?.id) {
    // check if it's a entangler key, otherwise it's a mint key
    const id = new PublicKey(context.params?.id as string);
    const fungibleEntanglerSdk = await FungibleEntangler.init(provider);
    const entangler = await fungibleEntanglerSdk.getChildEntangler(id);
    if (entangler) {
      const parent = await fungibleEntanglerSdk.getParentEntangler(entangler.parentEntangler);
      mintKeyStr = parent.parentMint.toString();
    } else {
      mintKeyStr = context.params?.id;
    }
  }
  const mint = new PublicKey(mintKeyStr);
  const tokenMetadataSdk = await SplTokenMetadata.init(provider);
  const metadataAcc = await tokenMetadataSdk.getMetadata(
    await Metadata.getPDA(mint)
  );
  let metadata = null;
  try {
    metadata = await SplTokenMetadata.getArweaveMetadata(metadataAcc?.data.uri);
  } catch (e: any) {
    console.error(e);
  }

  const name =
    metadataAcc?.data?.name.length == 32
      ? metadata?.name
      : metadataAcc?.data?.name;

  return {
    props: {
      name: name || null,
      description: metadata?.description || null,
      image: (await SplTokenMetadata.getImage(metadataAcc?.data.uri)) || null,
    },
  };
};
