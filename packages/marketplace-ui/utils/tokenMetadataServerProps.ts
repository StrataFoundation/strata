import { Provider } from "@project-serum/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { GetServerSideProps } from "next";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { DEFAULT_ENDPOINT } from "@/components/Wallet";
import { SplTokenMetadata } from "@strata-foundation/spl-utils";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";

export const tokenBondingMetadataServerSideProps: GetServerSideProps = async (
  context
) => {
  const connection = new Connection(DEFAULT_ENDPOINT);
  const provider = new Provider(
    connection,
    new NodeWallet(Keypair.generate()),
    {}
  );
  const tokenBondingSdk = await SplTokenBonding.init(provider);
  const tokenBondingAcct = await tokenBondingSdk.getTokenBonding(
    new PublicKey(context.params?.tokenBondingKey as string)
  );
  const tokenMetadataSdk = await SplTokenMetadata.init(provider);
  const metadataAcc =
    tokenBondingAcct &&
    (await tokenMetadataSdk.getMetadata(
      await Metadata.getPDA(tokenBondingAcct?.targetMint)
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