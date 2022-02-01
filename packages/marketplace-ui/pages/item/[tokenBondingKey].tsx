import { Box, Center } from "@chakra-ui/react";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { Provider } from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { usePublicKey } from "@strata-foundation/react";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { SplTokenMetadata } from "@strata-foundation/spl-utils";
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { useRouter } from 'next/router';
import React from "react";
import { MarketplaceItem } from "@/components/MarketplaceItem";
import { DEFAULT_ENDPOINT } from "@/components/Wallet";


export const getServerSideProps: GetServerSideProps = async (context) => {
  const connection = new Connection(DEFAULT_ENDPOINT);
  const provider = new Provider(connection, new NodeWallet(Keypair.generate()), {})
  const tokenBondingSdk = await SplTokenBonding.init(provider);
  const tokenBondingAcct = (await tokenBondingSdk.getTokenBonding(new PublicKey(context.params?.tokenBondingKey as string)));
  const tokenMetadataSdk = await SplTokenMetadata.init(provider);
  const metadataAcc = tokenBondingAcct && (await tokenMetadataSdk.getMetadata(await Metadata.getPDA(tokenBondingAcct?.targetMint)));
  const metadata = await SplTokenMetadata.getArweaveMetadata(metadataAcc?.data.uri);

  return {
    props: {
      name: metadataAcc?.data.name || null,
      description: metadata?.description || null,
      image: await SplTokenMetadata.getImage(metadataAcc?.data.uri) || null,
    }
  }
}


export const MarketDisplay: NextPage = ({ name, image, description }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter()
  const { tokenBondingKey: tokenBondingKeyRaw } = router.query;
  const tokenBondingKey = usePublicKey(tokenBondingKeyRaw as string);

  return <Box h="100vh">
    <Head>
      <title>{name}</title>
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="og:type" content="website" />
      <meta name="description" content={description} />
      <meta property="og:title" content={name} />
      <meta property="og:image" content={image} />
      <meta property="og:description" content={description} />
      <link rel="icon" href="/favicon.ico" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content="marketplace.strataprotocol.com" />
      <meta property="twitter:url" content={`https://marketplace.strataprotocol.com/item/${tokenBondingKeyRaw}/`} />
      <meta name="twitter:title" content={name} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Head>
    <Box w="full" h="full" overflow="auto" paddingTop={{ sm: "18px" }}>
      <Center flexGrow={1}>
        <Center bg="white" shadow="xl" rounded="lg" maxW="600px">
          <MarketplaceItem 
            name={name}
            description={description}
            image={image}
            tokenBondingKey={tokenBondingKey}
          />
        </Center>
      </Center>
    </Box>
  </Box>
}

export default MarketDisplay;