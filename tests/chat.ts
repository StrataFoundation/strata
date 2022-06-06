import { NAMESPACES_IDL, NAMESPACES_PROGRAM, NAMESPACES_PROGRAM_ID } from "@cardinal/namespaces";
import * as anchor from "@project-serum/anchor";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { Keypair, PublicKey, SystemInstruction, SystemProgram } from "@solana/web3.js";
import { ChatSdk, IChat, IdentifierType, MessageType } from "@strata-foundation/chat";
import { createMint, sendInstructions, sendMultipleInstructions } from "@strata-foundation/spl-utils";
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
  anchor.setProvider(anchor.AnchorProvider.local("http://127.0.0.1:8899"));
  const provider = anchor.getProvider() as AnchorProvider;

  const program = anchor.workspace.Chat;
  const tokenUtils = new TokenUtils(provider);
  const litClient = new LitJsSdk.LitNodeClient();
  const namespacesProgram = new Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const chatSdk = new ChatSdk(provider, program, litClient, namespacesProgram);
  const me = chatSdk.wallet.publicKey;

  before(async () => {
    await chatSdk.initializeNamespaces();
  })

  describe("initialize chat", () => {
    let readPermissionMint: PublicKey;
    let postPermissionMint: PublicKey;

    before(async () => {
      await chatSdk.initializeNamespaces();
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
      const { certificateMint: chatIdentifierCertificateMint } = await chatSdk.claimIdentifier({
        identifier,
        type: IdentifierType.Chat,
      })
      const { chat } = await chatSdk.initializeChat({
        identifierCertificateMint: chatIdentifierCertificateMint,
        name,
        readPermissionMintOrCollection: readPermissionMint,
        postPermissionMintOrCollection: postPermissionMint,
      });
      const chatAcc = await chatSdk.getChat(chat);
      expect(chatAcc?.identifierCertificateMint.toBase58()).to.eq(
        chatIdentifierCertificateMint.toBase58()
      );
      expect(chatAcc?.name).to.eq(name);
      expect(chatAcc?.readPermissionMintOrCollection?.toBase58()).to.eq(
        readPermissionMint.toBase58()
      );
      expect(chatAcc?.postPermissionMintOrCollection?.toBase58()).to.eq(
        postPermissionMint.toBase58()
      );
    })
  })

  describe("initialize profile", () => {
    it("intializes a profile", async () => {
      const username = randomIdentifier();
      const { certificateMint: userIdentifierCertificateMint } =
        await chatSdk.claimIdentifier({
          identifier: username,
          type: IdentifierType.User,
        });
      const { walletProfile } = await chatSdk.initializeProfile({
        identifierCertificateMint: userIdentifierCertificateMint,
        imageUrl: "hey",
      });

      const profileAcc = await chatSdk.getProfile(walletProfile);
      expect(profileAcc?.identifierCertificateMint.toBase58()).to.eq(
        userIdentifierCertificateMint.toBase58()
      );
      expect(profileAcc?.imageUrl).to.eq("hey");
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

      const { certificateMint: chatIdentifierCertificateMint } = await chatSdk.claimIdentifier({
        identifier,
        type: IdentifierType.Chat,
      });
      ({ chat } = await chatSdk.initializeChat({
        identifierCertificateMint: chatIdentifierCertificateMint,
        name,
        readPermissionMintOrCollection: readPermissionMint,
        postPermissionMintOrCollection: postPermissionMint,
      }));
      chatAcc = (await chatSdk.getChat(chat))!;

      const { instructions: claimInstructions, signers: claimSigners, output: { certificateMint: userIdentifierCertificateMint } } =
        await chatSdk.claimIdentifierInstructions({
          identifier: username,
          type: IdentifierType.User,
          owner: profileKeypair.publicKey,
        });
      const {
        output: { walletProfile: outWalletProfile },
        signers,
        instructions,
      } = await chatSdk.initializeProfileInstructions({
        identifier: username,
        ownerWallet: profileKeypair.publicKey,
        identifierCertificateMint: userIdentifierCertificateMint,
        imageUrl: "hey",
      });

      const { instructions: dInstructions, signers: dSigners } =
        await chatSdk.initializeDelegateWalletInstructions({
          delegateWalletKeypair,
        });

      walletProfile = outWalletProfile;

      try {
        await sendMultipleInstructions(
          new Map(),
          provider,
          [
            [
              SystemProgram.transfer({
                fromPubkey: provider.wallet.publicKey,
                toPubkey: profileKeypair.publicKey,
                lamports: 10000000000,
              }),
            ],
            ...claimInstructions,
            instructions,
            dInstructions,
          ],
          [
            [],
            [...claimSigners[0]],
            [...claimSigners[1], profileKeypair],
            [...signers, profileKeypair],
            dSigners,
          ],
          me
        );
      } catch (e: any) {
        console.error(e)
        throw e
      }
    });

    it("allows sending a basic message with delegate", async () => {
      const { txid } = await chatSdk.sendMessage({
        sender: profileKeypair.publicKey,
        delegateWalletKeypair,
        chat,
        message: { type: MessageType.Text, text: "hello" },
        encrypted: false,
      });
      const [{ decodedMessage }] = await chatSdk.getMessagesFromTx(txid!);
      expect(decodedMessage?.text).to.eq("hello")
    });

    it("allows sending a basic message without delegate", async () => {
      const { instructions, signers } = await chatSdk.sendMessageInstructions({
        sender: profileKeypair.publicKey,
        chat,
        message: { type: MessageType.Text, text: "hey" },
        encrypted: false,
      });
      const txid = await sendInstructions(chatSdk.errors || new Map(), provider, instructions, [...signers, profileKeypair]);
      const [{ decodedMessage }] = await chatSdk.getMessagesFromTx(txid!);
      expect(decodedMessage?.text).to.eq("hey");
    });
  });
})