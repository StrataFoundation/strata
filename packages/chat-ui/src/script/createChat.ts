import { ChatSdk, IdentifierType } from "@strata-foundation/chat";
import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
// @ts-ignore
import LitJsSdk from "lit-js-sdk";
import { ChatIDL } from "@strata-foundation/chat";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { NAMESPACES_IDL, NAMESPACES_PROGRAM, NAMESPACES_PROGRAM_ID } from "@cardinal/namespaces";

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
  const chatSdk = new ChatSdk(provider, chat, client, namespacesProgram);
  await chatSdk.initializeNamespaces();

  console.log("Claiming identifier...");
  const { certificateMint: identifierCertificateMint } = await chatSdk.claimIdentifier({
    type: IdentifierType.Chat,
    identifier: args[2],
  });
  console.log("Init chat...");
  await chatSdk.initializeChat({
    identifierCertificateMint,
    name: args[3],
    readPermissionMintOrCollection: new PublicKey(args[4]),
    postPermissionMintOrCollection: new PublicKey(args[4]),
    imageUrl: args[5]
  });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});