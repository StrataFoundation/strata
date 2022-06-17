import { ChatSdk, IdentifierType } from "@strata-foundation/chat";
import * as anchor from "@project-serum/anchor";
// @ts-ignore
import LitJsSdk from "lit-js-sdk";
import { ChatIDL } from "@strata-foundation/chat";
import { AnchorProvider, Program } from "@project-serum/anchor";
import {
  NAMESPACES_IDL,
  NAMESPACES_PROGRAM,
  NAMESPACES_PROGRAM_ID,
} from "@cardinal/namespaces";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { SystemProgram } from "@solana/web3.js";
import { truthy } from "@strata-foundation/react";

const args = process.argv;
async function run(): Promise<void> {
  console.log(process.env.ANCHOR_PROVIDER_URL);
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as AnchorProvider;

  const ChatIDLJson = await Program.fetchIdl(ChatSdk.ID, provider);
  const chat = new Program<ChatIDL>(
    ChatIDLJson as ChatIDL,
    ChatSdk.ID,
    provider
  ) as Program<ChatIDL>;
  const client = new LitJsSdk.LitNodeClient();
  const namespacesProgram = new Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const chatSdk = new ChatSdk({
    provider,
    program: chat,
    litClient: client,
    namespacesProgram,
  });
  await chatSdk.initializeNamespaces();
  const namespaces = await chatSdk.getNamespaces();

  console.log("getting")
  // const profiles = await chatSdk.account.profileV0.all()
      let resp = await provider.connection.getProgramAccounts(
        chatSdk.programId,
        {
          commitment: provider.connection.commitment,
          filters: [
            {
              memcmp: chatSdk.program.coder.accounts.memcmp(
                // @ts-ignore
                "profileV0",
                undefined
              ),
            },
          ],
        }
      );
    const profiles = (resp.map(({ pubkey, account }) => {
      try {
        return {
          publicKey: pubkey,
          account: chatSdk.program.coder.accounts.decode(
            "ProfileV0",
            account.data
          ),
        };
      } catch (e: any) {
        /// ignore
      }
    })).filter(truthy);

  await Promise.all(["ZyrB", "JRR"].map(async identifier => {
    const entryKey = (await ChatSdk.entryKey(namespaces.userNamespace, identifier))[0]
    const entry = await chatSdk.namespacesProgram.account.entry.fetch(entryKey);

    if (entry) {
      console.log("Adding", identifier, entryKey.toBase58());
      try {
        await chatSdk.rpc.initializeMarkerTemp({
          accounts: {
            payer: provider.wallet.publicKey,
            namespace: namespaces.userNamespace,
            entry: entryKey,
            caseInsensitiveMarker: (
              await ChatSdk.caseInsensitiveMarkerKey(
                namespaces.userNamespace,
                identifier
              )
            )[0],
            systemProgram: SystemProgram.programId,
          },
        });
      } catch(e: any) {
        console.warn("Failed", identifier, e);
      }
    }
  }))
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
