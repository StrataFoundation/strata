import * as anchor from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { ChatSdk, IChat } from "@strata-foundation/chat";
import { createMint, sendInstructions } from "@strata-foundation/spl-utils";
import { expect, use } from "chai";
import ChaiAsPromised from "chai-as-promised";
// @ts-ignore
import LitJsSdk from "lit-js-sdk";
import { v4 as uuid } from "uuid";
import { TokenUtils } from "./utils/token";

use(ChaiAsPromised);

function randomIdentifier(): string {
  return Math.random().toString(32).slice(2);
}

describe("chat", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.local("http://127.0.0.1:8899"));
  const provider = anchor.getProvider();

  const program = anchor.workspace.Chat;
  const tokenUtils = new TokenUtils(provider);
  const litClient = new LitJsSdk.LitNodeClient();
  const chatSdk = new ChatSdk(provider, program, litClient);
  const me = chatSdk.wallet.publicKey;

  describe("initialize chat", () => {
    let readPermissionMint: PublicKey;
    let postPermissionMint: PublicKey;

    before(async () => {
      readPermissionMint = await createMint(provider, me, 9);
      postPermissionMint = readPermissionMint;
      await tokenUtils.createAtaAndMint(
        provider,
        readPermissionMint,
        10
      );
    })
    
    it("intializes a chat", async () => {
      const identifier = randomIdentifier();
      const name = "Test Test";
      const { chat } = await chatSdk.initializeChat({
        identifier,
        name,
        readPermissionMint,
        postPermissionMint,
      });
      const chatAcc = await chatSdk.getChat(chat);
      expect(chatAcc?.identifier).to.eq(identifier);
      expect(chatAcc?.name).to.eq(name);
      expect(chatAcc?.readPermissionMint?.toBase58()).to.eq(
        readPermissionMint.toBase58()
      );
      expect(chatAcc?.postPermissionMint?.toBase58()).to.eq(
        postPermissionMint.toBase58()
      );
    })
  })

  describe("initialize profile", () => {
    it("intializes a profile", async () => {
      const username = randomIdentifier();
      const { walletProfile, delegateWalletKeypair } =
        await chatSdk.initializeProfile({
          username,
          imageUrl: "hey"
        });
      
      const profileAcc = await chatSdk.getProfile(walletProfile);
      expect(profileAcc?.username).to.eq(username);
      expect(profileAcc?.imageUrl).to.eq("hey");
      expect(profileAcc?.delegateWallet.toBase58()).to.eq(delegateWalletKeypair?.publicKey.toBase58());
    });
  });

  describe("messaging", () => {
    let readPermissionMint: PublicKey;
    let postPermissionMint: PublicKey;
    let chat: PublicKey;
    let walletProfile: PublicKey;
    let chatAcc: IChat;
    const identifier = randomIdentifier();
    const username = randomIdentifier();
    const name = "Test Test";
    const delegateWalletKeypair: Keypair = Keypair.generate();
    const profileKeypair: Keypair = Keypair.generate();

    before(async () => {
      readPermissionMint = await createMint(provider, me, 1);
      postPermissionMint = readPermissionMint;
      await tokenUtils.createAtaAndMint(provider, readPermissionMint, 10, profileKeypair.publicKey);
      const noah = new PublicKey("wwm872RcvN7XwNZBjXLSHfAYrFUATKgkV9v3BewHj5M");
      await tokenUtils.createAtaAndMint(
        provider,
        readPermissionMint,
        10,
        noah
      );

      ({ chat } = await chatSdk.initializeChat({
        identifier,
        name,
        readPermissionMint,
        postPermissionMint,
      }));
      chatAcc = (await chatSdk.getChat(chat))!;
      const { output: { walletProfile: outWalletProfile }, signers, instructions } =
        await chatSdk.initializeProfileInstructions({
          ownerWallet: profileKeypair.publicKey,
          delegateWalletKeypair,
          username,
          imageUrl: "hey",
        });

      walletProfile = outWalletProfile;

      await sendInstructions(
        new Map(),
        provider,
        instructions,
        [...signers, profileKeypair],
        me
      )
    });

    it("allows sending a basic encrypted message", async () => {
      console.log("Chat", chat.toBase58(), identifier)
      const { txid } = await chatSdk.sendMessage({
        sender: profileKeypair.publicKey,
        delegateWalletKeypair,
        chat,
        message: "hello",
        encrypted: false,
      });
      const [{ decodedMessage }] = await chatSdk.getMessagesFromTx(txid!);
      expect(decodedMessage).to.eq("hello")
    });
  });
})