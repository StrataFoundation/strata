import { ChatSdk } from "@strata-foundation/chat";
import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
// @ts-ignore
import LitJsSdk from "lit-js-sdk";
import { ChatIDL } from "@strata-foundation/chat";
import { Program } from "@project-serum/anchor";

const args = process.argv;
async function run(): Promise<void> {
  console.log(process.env.ANCHOR_PROVIDER_URL);
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.getProvider();

  const ChatIDLJson = await Program.fetchIdl(ChatSdk.ID, provider);
  const chat = new Program<ChatIDL>(
    ChatIDLJson as ChatIDL,
    ChatSdk.ID,
    provider
  ) as Program<ChatIDL>;
  const client = new LitJsSdk.LitNodeClient();

  const chatSdk = new ChatSdk(provider, chat, client);

  console.log(args)
  await chatSdk.initializeChat({
    identifier: args[2],
    name: args[3],
    readPermissionMint: new PublicKey(args[4]),
    postPermissionMint: new PublicKey(args[4]),
  });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});