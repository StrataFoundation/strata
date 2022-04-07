import { Provider } from "@project-serum/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { GetServerSideProps } from "next";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { DEFAULT_ENDPOINT } from "../components/Wallet";
import { SplTokenMetadata } from "@strata-foundation/spl-utils";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { getClusterAndEndpoint } from "../hooks";
import { Base64 } from "js-base64";
import axios from "axios";
import { tokenAuthFetchMiddleware } from "@strata-foundation/web3-token-auth";

async function getToken(): Promise<string> {
  if (process.env.ISSUER) {
    const token = Base64.encode(
      `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
    );
    const { access_token } = (
      await axios.post(
        `${process.env.ISSUER}/token`,
        "grant_type=client_credentials",
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${token}`,
          },
        }
      )
    ).data;
    return access_token;
  }

  return "";
}

export const mintMetadataServerSideProps: GetServerSideProps = async (
  context
) => {
  const { endpoint } = getClusterAndEndpoint((context.query.cluster || DEFAULT_ENDPOINT) as string);

  const connection = new Connection(endpoint, {
    fetchMiddleware: tokenAuthFetchMiddleware({
      getToken
    })
  });
  const provider = new Provider(
    connection,
    new NodeWallet(Keypair.generate()),
    {}
  );
  const mint = new PublicKey(context.params?.mintKey as string);
  const tokenMetadataSdk = await SplTokenMetadata.init(provider);
  const metadataAcc =
    (await tokenMetadataSdk.getMetadata(
      await Metadata.getPDA(mint)
    ));
  let metadata = null;
  try {
    metadata = await SplTokenMetadata.getArweaveMetadata(
      metadataAcc?.data.uri
    );
  } catch (e: any) {
    console.error(e);
  }

  const name = metadataAcc?.data?.name.length == 32 ? metadata?.name : metadataAcc?.data?.name;

  return {
    props: {
      name: name || null,
      description: metadata?.description || null,
      image: (await SplTokenMetadata.getImage(metadataAcc?.data.uri)) || null,
    },
  };
};