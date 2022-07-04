import {
  NAMESPACES_IDL,
  NAMESPACES_PROGRAM,
  NAMESPACES_PROGRAM_ID
} from "@cardinal/namespaces";
import * as anchor from "@project-serum/anchor";
import { AnchorProvider, Program } from "@project-serum/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey, SystemProgram
} from "@solana/web3.js";
import {
  ChatSdk,
  IChat,
  IdentifierType,
  MessageType
} from "@strata-foundation/chat";
import {
  createMint,
  sendInstructions,
  createAtaAndMint,
} from "@strata-foundation/spl-utils";
import { expect, use } from "chai";
import ChaiAsPromised from "chai-as-promised";
// @ts-ignore
import LitNodeJsSdk from "lit-js-sdk/build/index.node.js";
import { TokenUtils } from "./utils/token";
import { initializeUser, initializeChat, getAuthSig } from "./utils/chat";

use(ChaiAsPromised);

function randomIdentifier(): string {
  return Math.random().toString(32).slice(2);
}

const GETTYSBURG_ADDRESS = `
Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.

Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this.

But, in a larger sense, we can not dedicate -- we can not consecrate -- we can not hallow -- this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember what we say here, but it can never forget what they did here. It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced. It is rather for us to be here dedicated to the great task remaining before us -- that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion -- that we here highly resolve that these dead shall not have died in vain -- that this nation, under God, shall have a new birth of freedom -- and that government of the people, by the people, for the people, shall not perish from the earth.
`;

describe("chat", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.local("http://127.0.0.1:8899"));
  const provider = anchor.getProvider() as AnchorProvider;

  const program = anchor.workspace.Chat;
  const tokenUtils = new TokenUtils(provider);
  const litClient = new LitNodeJsSdk.LitNodeClient({
    debug: false,
    alerts: false
  });
  const namespacesProgram = new Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const chatSdk = new ChatSdk({
    provider,
    program,
    litClient,
    namespacesProgram,
  });
  chatSdk.litJsSdk = LitNodeJsSdk;
  const me = chatSdk.wallet.publicKey;

  before(async () => {
    await chatSdk.initializeNamespaces();
    await litClient.connect();
  });

  describe("initialize chat", () => {
    let readPermissionMint: PublicKey;
    let postPermissionMint: PublicKey;

    before(async () => {
      await chatSdk.initializeNamespaces();
      readPermissionMint = await createMint(provider, me, 9);
      postPermissionMint = readPermissionMint;
      await createAtaAndMint(provider, readPermissionMint, 10);
    });

    it("intializes a chat", async () => {
      const identifier = randomIdentifier();
      const name = "Test Test";
      const { certificateMint: chatIdentifierCertificateMint } =
        await chatSdk.claimIdentifier({
          identifier,
          type: IdentifierType.Chat,
        });
      const { chat } = await chatSdk.initializeChat({
        identifierCertificateMint: chatIdentifierCertificateMint,
        name,
        readPermissionKey: readPermissionMint,
        postPermissionKey: postPermissionMint,
      });
      const chatAcc = await chatSdk.getChat(chat);
      expect(chatAcc?.identifierCertificateMint.toBase58()).to.eq(
        chatIdentifierCertificateMint.toBase58()
      );
      expect(chatAcc?.name).to.eq(name);
      expect(chatAcc?.readPermissionKey?.toBase58()).to.eq(
        readPermissionMint.toBase58()
      );
      expect(chatAcc?.postPermissionKey?.toBase58()).to.eq(
        postPermissionMint.toBase58()
      );
    });
  });

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

  describe("initialize settings", () => {
    let tokenHolder = Keypair.generate();

    it("intializes settings", async () => {
      // manually authenticate lit protocol
      //@ts-ignore
      let authSig = await getAuthSig(
        tokenHolder.publicKey,
        tokenHolder.secretKey
      );
      chatSdk.litAuthSig = authSig;
      
      const { output: { settings }, instructions, signers } = await chatSdk.initializeSettingsInstructions({
        ownerWallet: tokenHolder.publicKey,
        settings: {
          delegateWalletSeed: "hello",
        },
      });
      await chatSdk.sendInstructions(instructions, [...signers, tokenHolder]);

      const settingsAcc = await chatSdk.getSettings(settings);
      const seed = await settingsAcc?.getDelegateWalletSeed();
      expect(seed).to.eq("hello");
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
      await createAtaAndMint(
        provider,
        readPermissionMint,
        10,
        profileKeypair.publicKey
      );
      chat = await initializeChat(chatSdk, identifier, name, readPermissionMint, postPermissionMint);
      chatAcc = (await chatSdk.getChat(chat))!;

      const {walletProfile: outWalletProfile} = await initializeUser(provider, chatSdk, username, profileKeypair, delegateWalletKeypair);
      walletProfile = outWalletProfile;
    });

    describe("permissions tests", () => {
      let devnetProvider;
      let tokenHolder = Keypair.generate();
      let nftHolder = Keypair.generate();
      let unauthorisedUser = Keypair.generate();
      let tokenChat: PublicKey;
      let nftChat: PublicKey;
      const nftMintKeypair = Keypair.generate();
      before(async() => {
        // init token holder
        const tokenHolderUsername = randomIdentifier();
        await initializeUser(provider, chatSdk, tokenHolderUsername, tokenHolder);

        // init nft holder
        const nftHolderUsername = randomIdentifier();
        await initializeUser(provider, chatSdk, nftHolderUsername, nftHolder);

        // init unauthorised user
        const unauthUsername = randomIdentifier();
        await initializeUser(provider, chatSdk, unauthUsername, unauthorisedUser);

        // devnet provider is required because lit protocol reads from devnet, not localhost
        const devnetConnection = new Connection("https://api.devnet.solana.com");
        devnetProvider = new AnchorProvider(devnetConnection, provider.wallet, AnchorProvider.defaultOptions());
        await devnetConnection.requestAirdrop(devnetProvider.wallet.publicKey, 1 * LAMPORTS_PER_SOL);

        // create permitted token on localnet and devnet
        const tokenMintKeypair = Keypair.generate();
        await createMint(provider, me, 2, tokenMintKeypair);
        await createAtaAndMint(
          provider,
          tokenMintKeypair.publicKey,
          1000,
          tokenHolder.publicKey
        );
        await createMint(devnetProvider, me, 2, tokenMintKeypair);
        await createAtaAndMint(
          devnetProvider,
          tokenMintKeypair.publicKey,
          1000,
          tokenHolder.publicKey,
          provider.wallet.publicKey,
          provider.wallet.publicKey,
          {
            commitment: 'finalized',
          }
        );

        // create chat where only token holders are auth
        const tokenChatId = randomIdentifier();
        tokenChat = await initializeChat(chatSdk, tokenChatId, name, tokenMintKeypair.publicKey, tokenMintKeypair.publicKey);

        // create nft from permitted collection on localnet and devnet
        const nftCollectionKeypair = Keypair.generate();
        // await createMint(provider, me, 0, nftCollectionKeypair);
        await tokenUtils.createTestNft(provider, nftHolder.publicKey, nftCollectionKeypair, provider.wallet.publicKey);
        await tokenUtils.createTestNft(provider, nftHolder.publicKey, nftMintKeypair, provider.wallet.publicKey, nftCollectionKeypair.publicKey);
        // await tokenUtils.createTestNft(devnetProvider, nftHolder.publicKey, nftMintKeypair, provider.wallet.publicKey, nftCollectionKeypair.publicKey);

        // create chat where nft holders of a collection are auth
        const nftChatId = randomIdentifier();
        nftChat = await initializeChat(chatSdk, nftChatId, name, nftCollectionKeypair.publicKey, nftCollectionKeypair.publicKey);
      })

      it("allows token holders", async() => {
        // manually authenticate lit protocol
        //@ts-ignore
        let authSig = await getAuthSig(tokenHolder.publicKey, tokenHolder.secretKey)
        chatSdk.litAuthSig = authSig;
        const { instructions, signers } = await chatSdk.sendMessageInstructions({
          sender: tokenHolder.publicKey,
          chat: tokenChat,
          message: { type: MessageType.Text, text: "hello" },
          encrypted: true,
        });
        const txid = await sendInstructions(
          chatSdk.errors || new Map(),
          provider,
          instructions[0],
          [...signers[0], tokenHolder]
        );
        
        const parts = await chatSdk.getMessagePartsFromTx(txid);
        const { getDecodedMessage } = (await chatSdk.getMessageFromParts(parts))!;
        const decodedMessage = await getDecodedMessage();
        expect(decodedMessage?.text).to.eq("hello");
      })

      it("allows nft holders", async() => {
        // manually authenticate lit protocol
        //@ts-ignore
        let authSig = await getAuthSig(nftHolder.publicKey, nftHolder.secretKey)
        chatSdk.litAuthSig = authSig;

        const { instructions, signers } = await chatSdk.sendMessageInstructions({
          sender: nftHolder.publicKey,
          chat: nftChat,
          message: { type: MessageType.Text, text: "hello" },
          encrypted: false,
          nftMint: nftMintKeypair.publicKey,
        });
        const txid = await sendInstructions(
          chatSdk.errors || new Map(),
          provider,
          instructions[0],
          [...signers[0], nftHolder]
        );
        const parts = await chatSdk.getMessagePartsFromTx(txid);
        const { getDecodedMessage } = (await chatSdk.getMessageFromParts(parts))!;
        const decodedMessage = await getDecodedMessage();
        expect(decodedMessage?.text).to.eq("hello");
      })

      it("doesn't allow other users", async() => {
        const { instructions, signers } = await chatSdk.sendMessageInstructions({
          sender: unauthorisedUser.publicKey,
          chat: tokenChat,
          message: { type: MessageType.Text, text: "hello" },
          encrypted: false,
        });

        expect(
          sendInstructions(
            chatSdk.errors || new Map(),
            provider,
            instructions[0],
            [...signers[0], unauthorisedUser]
        )).to.be.rejectedWith(Error);
      })
    })

    it("allows sending a basic message with delegate", async () => {
      const { txids } = await chatSdk.sendMessage({
        sender: profileKeypair.publicKey,
        delegateWalletKeypair,
        chat,
        message: { type: MessageType.Text, text: "hello" },
        encrypted: false,
      });
      const parts = await chatSdk.getMessagePartsFromTx((txids || [])[0]!);
      const { getDecodedMessage } = (await chatSdk.getMessageFromParts(parts))!;
      const decodedMessage = await getDecodedMessage();
      expect(decodedMessage?.text).to.eq("hello");
    });

    it("allows sending a basic message without delegate", async () => {
      const { instructions, signers } = await chatSdk.sendMessageInstructions({
        sender: profileKeypair.publicKey,
        chat,
        message: { type: MessageType.Text, text: "hey" },
        encrypted: false,
      });
      const txid = await sendInstructions(
        chatSdk.errors || new Map(),
        provider,
        instructions[0],
        [...signers[0], profileKeypair]
      );
      const parts = await chatSdk.getMessagePartsFromTx(txid);
      const { getDecodedMessage } = (await chatSdk.getMessageFromParts(
        parts
      ))!;
      const decodedMessage = await getDecodedMessage();
      expect(decodedMessage?.text).to.eq("hey");
    });

    it("allows sending a really long message", async () => {
      const { txids } = await chatSdk.sendMessage({
        sender: profileKeypair.publicKey,
        delegateWalletKeypair,
        chat,
        message: {
          type: MessageType.Text,
          text: GETTYSBURG_ADDRESS,
        },
        encrypted: false,
      });
      const parts = (
        await Promise.all(
          Array.from(txids || []).map((txid) =>
            chatSdk.getMessagePartsFromTx(txid!)
          )
        )
      ).flat();
      const { getDecodedMessage } = (await chatSdk.getMessageFromParts(
        parts
      ))!;
      const decodedMessage = await getDecodedMessage();
      expect(decodedMessage?.text).to.eq(GETTYSBURG_ADDRESS);
    });
  });
});
