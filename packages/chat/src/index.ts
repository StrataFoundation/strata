import { BN, IdlAccounts, IdlTypes, Program, Provider } from "@project-serum/anchor";
import { Commitment, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  AnchorSdk,
  getMintInfo,
  InstructionResult,
  toBN,
  truthy,
  TypedAccountParser,
} from "@strata-foundation/spl-utils";
import { ChatIDL, ChatV0, PostAction, ProfileV0 } from "./generated/chat";
// @ts-ignore
import LitJsSdk from "lit-js-sdk";
import { v4 as uuid } from "uuid";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
// @ts-ignore
import LitJsSdk from "lit-js-sdk";
// @ts-ignore
import * as bs58 from "bs58";

export * from "./generated/chat";

export enum MessageType {
  Text = "text"
}

export interface IMessageContent {
  type: MessageType;
  text: string;
}

export interface IChat extends ChatV0 {
  publicKey: PublicKey;
}

export interface IProfile extends ProfileV0 {
  publicKey: PublicKey;
}

type MessageV0 = IdlTypes<ChatIDL>["MessageV0"];
export interface IMessage extends MessageV0 {
  txid: string;
  /** Decoded message, if permissions were enough to decode it */
  decodedMessage?: string;
  profileKey: PublicKey;
}

export interface InitializeChatArgs {
  payer?: PublicKey;
  /** The admin of this chat instance. **Default:** This wallet */
  admin?: PublicKey;
  /** The unique shortname of the chat. Must be alphanumeric. */
  identifier: string;
  /** Human readable name for the chat */
  name: string;
  /** The mint you need to read this chat */
  readPermissionMint: PublicKey;
  /** The mint you need to post to this chat */
  postPermissionMint: PublicKey;
  /** The number of tokens needed to post to this chat. **Default:** 1 */
  postPermissionAmount?: number | BN;
  /** The action to take when posting. **Default:** hold */
  postPermissionAction?: PostAction;
  /** The amount of tokens needed to read. **Default:** 1 */
  readPermissionAmount?: number;
  /** Lit protocol conditions. **Default:** `readAmount` readPermissionMint */
  defaultAccessControlConditions?: any;
  /** The destination to pay to on post */
  postPayDestination?: PublicKey;
  imageUrl?: string;
  metadataUrl?: string;
}

export interface InitializeProfileArgs {
  payer?: PublicKey;
  /** The owner of this profile. **Default:** the current wallet */
  ownerWallet?: PublicKey;
  /** The unique shortname of the user. Must be alphanumeric. */
  username: string;
  imageUrl?: string;
  metadataUrl?: string;
}

export interface InitializeDelegateWalletArgs {
  payer?: PublicKey;
  /** The owning wallet of the delegate. **Default:** the current wallet */
  ownerWallet?: PublicKey;
  /** The delegate wallet to use. **Default:** from keypair */
  delegateWallet?: PublicKey;
  /** The delegate keypair. **Default:** Generate one */
  delegateWalletKeypair?: Keypair;
}

export interface SendMessageArgs {
  payer?: PublicKey;
  /** The chat to send to */
  chat: PublicKey;
  /** The message to send, typically a json string. */
  message: string;
  /** Lit protocol conditions, **Default:** The chatroom default */
  accessControlConditions?: any;

  /** If using a delegate wallet, will send and sign. **Defualt:** delegateWalletKeypair.publicKey */
  delegateWallet?: PublicKey;
  /** If using a delegate wallet, will send and sign */
  delegateWalletKeypair?: Keypair;

  /** The ownerWallet of the sender. **Default:** this wallet*/
  sender?: PublicKey;

  /** Should we encrypt this message using lit protocol? */
  encrypted?: boolean;
}

function puff(str: string, len: number): string {
  return str.padEnd(32, "\0");
}

function depuff(str: string): string {
  return str.replace(new RegExp("\0", "g"), "");
}

export class ChatSdk extends AnchorSdk<ChatIDL> {
  litClient: LitJsSdk;
  litAuthSig: any | undefined;
  chain: string;

  static ID = new PublicKey("2hC44EVzM4JoL5EWU4ezcZsY6ns2puwxpivQdeUMTzZM");

  get isLitAuthed() {
    return Boolean(this.litAuthSig);
  }

  async litAuth() {
    this.litAuthSig = await LitJsSdk.checkAndSignAuthMessage({
      chain: this.chain,
    });
  }

  static async init(
    provider: Provider,
    chatProgramId: PublicKey = ChatSdk.ID
  ): Promise<ChatSdk> {
    const ChatIDLJson = await Program.fetchIdl(chatProgramId, provider);
    const chat = new Program<ChatIDL>(
      ChatIDLJson as ChatIDL,
      chatProgramId,
      provider
    ) as Program<ChatIDL>;
    const client = new LitJsSdk.LitNodeClient();
    await client.connect();

    return new this(provider, chat, client);
  }

  constructor(
    provider: Provider,
    program: Program<ChatIDL>,
    litClient: LitJsSdk
  ) {
    super({ provider, program });

    // @ts-ignore
    if (provider.connection._rpcEndpoint.includes("dev")) {
      this.chain = "solanaDevnet";
    } else {
      this.chain = "solana";
    }
    this.litClient = litClient;
  }

  chatDecoder: TypedAccountParser<IChat> = (pubkey, account) => {
    const coded = this.program.coder.accounts.decode<IChat>(
      "ChatV0",
      account.data
    );

    return {
      ...coded,
      identifier: depuff(coded.identifier),
      name: depuff(coded.name),
      imageUrl: depuff(coded.imageUrl),
      metadataUrl: depuff(coded.metadataUrl),
      publicKey: pubkey,
    };
  };

  profileDecoder: TypedAccountParser<IProfile> = (pubkey, account) => {
    const coded = this.program.coder.accounts.decode<IProfile>(
      "ProfileV0",
      account.data
    );

    return {
      ...coded,
      username: depuff(coded.username),
      imageUrl: depuff(coded.imageUrl),
      metadataUrl: depuff(coded.metadataUrl),
      publicKey: pubkey,
    };
  };

  getChat(chatKey: PublicKey): Promise<IChat | null> {
    return this.getAccount(chatKey, this.chatDecoder);
  }

  getProfile(profileKey: PublicKey): Promise<IProfile | null> {
    return this.getAccount(profileKey, this.profileDecoder);
  }

  async getMessagesFromTx(txid: string): Promise<IMessage[]> {
    const connection = this.provider.connection;
    const tx = await connection.getTransaction(txid, {
      commitment: "confirmed",
    });

    if (!tx) {
      return [];
    }

    if (tx.meta?.err) {
      return [];
    }

    const instructions = tx.transaction.message.instructions.filter(ix => tx.transaction.message.accountKeys[ix.programIdIndex].equals(this.programId));
    const coder = this.program.coder.instruction;

    const sendMessageIdl = this.program.idl.instructions.find(
      (i: any) => i.name === "sendMessageV0"
    )!;
    const profileAccountIndex = sendMessageIdl.accounts.findIndex(
      (account: any) => account.name === "profile"
    );
    const decoded = instructions
      .map((ix) => ({
        // @ts-ignore
        data: coder.decode(bs58.decode(ix.data)),
        profile:
          tx.transaction.message.accountKeys[ix.accounts[profileAccountIndex]],
      }))
      .filter(truthy);

    return Promise.all(
      decoded
        .filter((decoded) => decoded.data.name === "sendMessageV0")
        .map(async (decoded) => {
          const args = decoded.data.data.args;

          let decodedMessage;
          if (args.encryptedSymmetricKey) {
            if (!this.isLitAuthed) {
              await this.litAuth();
            }
            try {
              const symmetricKey = await this.litClient.getEncryptionKey({
                accessControlConditions: asArray(JSON.parse(args.accessControlConditions)),
                // Note, below we convert the encryptedSymmetricKey from a UInt8Array to a hex string.  This is because we obtained the encryptedSymmetricKey from "saveEncryptionKey" which returns a UInt8Array.  But the getEncryptionKey method expects a hex string.
                toDecrypt: args.encryptedSymmetricKey,
                chain: this.chain,
                authSig: this.litAuthSig,
              });
              decodedMessage = await LitJsSdk.decryptString(
                new Blob([args.content]),
                symmetricKey
              );
            } catch(e: any) {
              console.error("Failed to decode message", e);
            }
          } else {
            decodedMessage = args.content;
          }

          return {
            ...args,
            txid,
            profileKey: decoded.profile,
            decodedMessage,
          };
        })
    );
  }

  static chatKey(
    identifier: string,
    programId: PublicKey = ChatSdk.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [
        Buffer.from("chat", "utf-8"),
        Buffer.from(puff(identifier, 32), "utf-8"),
      ],
      programId
    );
  }

  static delegateWalletKey(
    delegateWallet: PublicKey,
    programId: PublicKey = ChatSdk.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from("delegate-wallet", "utf-8"), delegateWallet.toBuffer()],
      programId
    );
  }

  static profileKey(
    {
      username,
      wallet,
    }: {
      username?: string;
      wallet?: PublicKey;
    },
    programId: PublicKey = ChatSdk.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [
        Buffer.from(username ? "username_profile" : "wallet_profile", "utf-8"),
        username ? Buffer.from(puff(username, 32)) : wallet!.toBuffer(),
      ],
      programId
    );
  }

  async initializeChatInstructions({
    payer = this.wallet.publicKey,
    admin = this.wallet.publicKey,
    identifier,
    name,
    defaultAccessControlConditions,
    readPermissionMint,
    postPermissionMint,
    postPermissionAction = PostAction.Hold,
    postPayDestination,
    postPermissionAmount = 1,
    readPermissionAmount = 1,
    imageUrl = "",
    metadataUrl = "",
  }: InitializeChatArgs): Promise<InstructionResult<{ chat: PublicKey }>> {
    const chat = (await ChatSdk.chatKey(identifier, this.programId))[0];
    const postMint = await getMintInfo(this.provider, postPermissionMint);
    const readMint = await getMintInfo(this.provider, readPermissionMint);
    const instruction = await this.instruction.initializeChatV0(
      {
        admin: admin,
        identifier,
        name,
        imageUrl: imageUrl,
        metadataUrl: metadataUrl,
        defaultAccessControlConditions: Buffer.from(
          JSON.stringify(
            defaultAccessControlConditions || [{
              method: "getTokenAccountBalance",
              params: [readPermissionMint?.toBase58()],
              chain: this.chain,
              returnValueTest: {
                key: "amount",
                comparator: ">=",
                value: toBN(readPermissionAmount, readMint),
              },
            }]
          )
        ),
        postPermissionMint,
        readPermissionMint,
        postPermissionAction: postPermissionAction as never,
        postPermissionAmount: toBN(postPermissionAmount, postMint),
        postPayDestination: postPayDestination || null,
      },
      {
        accounts: {
          payer,
          chat,
          systemProgram: SystemProgram.programId,
        },
      }
    );

    return {
      output: {
        chat,
      },
      signers: [],
      instructions: [instruction],
    };
  }

  async initializeChat(
    args: InitializeChatArgs,
    commitment: Commitment = "confirmed"
  ): Promise<{ chat: PublicKey }> {
    return this.execute(
      this.initializeChatInstructions(args),
      args.payer,
      commitment
    );
  }

  async initializeProfileInstructions({
    payer = this.wallet.publicKey,
    ownerWallet = this.wallet.publicKey,
    username,
    imageUrl = "",
    metadataUrl = "",
  }: InitializeProfileArgs): Promise<
    InstructionResult<{
      usernameProfile: PublicKey;
      walletProfile: PublicKey;
    }>
  > {
    const instructions = [];

    const usernameProfile = (
      await ChatSdk.profileKey({ username }, this.programId)
    )[0];
    const walletProfile = (
      await ChatSdk.profileKey({ wallet: ownerWallet }, this.programId)
    )[0];

    instructions.push(
      await this.instruction.initializeProfileV0(
        {
          username,
          imageUrl,
          metadataUrl,
        },
        {
          accounts: {
            payer,
            usernameProfile,
            walletProfile,
            ownerWallet,
            systemProgram: SystemProgram.programId,
          },
        }
      )
    );

    return {
      output: {
        usernameProfile,
        walletProfile,
      },
      instructions,
      signers: [],
    };
  }

  async initializeProfile(
    args: InitializeProfileArgs,
    commitment: Commitment = "confirmed"
  ): Promise<{
    usernameProfile: PublicKey;
    walletProfile: PublicKey;
  }> {
    return this.execute(
      this.initializeProfileInstructions(args),
      args.payer,
      commitment
    );
  }

  async initializeDelegateWalletInstructions({
    payer = this.wallet.publicKey,
    ownerWallet = this.wallet.publicKey,
    delegateWalletKeypair,
    delegateWallet,
  }: InitializeDelegateWalletArgs): Promise<
    InstructionResult<{
      delegateWallet: PublicKey;
      delegateWalletKeypair?: Keypair;
    }>
  > {
    if (!delegateWalletKeypair && !delegateWallet) {
      delegateWalletKeypair = Keypair.generate();
    }
    if (!delegateWallet) {
      delegateWallet = delegateWalletKeypair!.publicKey;
    }

    const delegateWalletAcc = (
      await ChatSdk.delegateWalletKey(delegateWallet)
    )[0];
    const instructions = [];
    const signers = [delegateWalletKeypair].filter(truthy);

    instructions.push(
      await this.instruction.initializeDelegateWalletV0({
        accounts: {
          delegateWallet: delegateWalletAcc,
          payer,
          owner: ownerWallet,
          delegate: delegateWallet,
          systemProgram: SystemProgram.programId,
        },
      })
    );

    return {
      output: {
        delegateWallet: delegateWalletAcc,
        delegateWalletKeypair,
      },
      instructions,
      signers,
    };
  }

  async initializeDelegateWallet(
    args: InitializeProfileArgs,
    commitment: Commitment = "confirmed"
  ): Promise<{
    delegateWallet: PublicKey;
    delegateWalletKeypair?: Keypair;
  }> {
    return this.execute(
      this.initializeDelegateWalletInstructions(args),
      args.payer,
      commitment
    );
  }

  async sendMessageInstructions({
    payer = this.wallet.publicKey,
    sender = this.wallet.publicKey,
    chat,
    message,
    accessControlConditions,
    delegateWallet,
    delegateWalletKeypair,
    encrypted = true,
  }: SendMessageArgs): Promise<InstructionResult<null>> {
    if (!this.isLitAuthed && encrypted) {
      await this.litAuth();
    }

    const chatAcc = (await this.getChat(chat))!;
    const chatAccConditions = JSON.parse(
      (chatAcc.defaultAccessControlConditions as Buffer).toString("utf-8")
    );
    const accessControlConditionsToUse =
      accessControlConditions || chatAccConditions;

    let encryptedSymmetricKey, encryptedString;
    if (encrypted) {
      const { encryptedString: encryptedStringOut, symmetricKey } =
        await LitJsSdk.encryptString(message);
      encryptedString = await encryptedStringOut.text();
      encryptedSymmetricKey = LitJsSdk.uint8arrayToString(
        await this.litClient.saveEncryptionKey({
          accessControlConditions: asArray(accessControlConditionsToUse),
          symmetricKey,
          authSig: this.litAuthSig,
          chain: this.chain,
        }),
        "base16"
      );
    } else {
      encryptedSymmetricKey = "";
      encryptedString = message;
    }


    const instructions = [];

    const profile = (
      await ChatSdk.profileKey({ wallet: sender }, this.programId)
    )[0];
    const profileAcc = (await this.getProfile(profile))!;

    const postPermissionAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      chatAcc.postPermissionMint,
      profileAcc.ownerWallet,
      true
    );

    const remainingAccounts = [];
    if (delegateWallet || delegateWalletKeypair) {
      if (!delegateWallet) {
        delegateWallet = delegateWalletKeypair!.publicKey
      }

      remainingAccounts.push({
        pubkey: (await ChatSdk.delegateWalletKey(delegateWallet, this.programId))[0],
        isWritable: false,
        isSigner: false
      });
    }

    const senderToUse = delegateWallet || sender;

    instructions.push(
      await this.instruction.sendMessageV0(
        {
          id: uuid(),
          content: encryptedString,
          encryptedSymmetricKey,
          accessControlConditions: JSON.stringify(accessControlConditionsToUse),
          nextId: null,
        },
        {
          accounts: {
            payer,
            chat,
            sender: senderToUse,
            profile,
            postPermissionAccount,
            postPermissionMint: chatAcc.postPermissionMint,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
          remainingAccounts
        },
      )
    );

    return {
      instructions,
      output: null,
      signers: [delegateWalletKeypair].filter(truthy),
    };
  }

  async sendMessage(
    args: SendMessageArgs,
    commitment: Commitment = "confirmed"
  ): Promise<{
    txid?: string;
  }> {
    return this.execute(
      this.sendMessageInstructions(args),
      args.payer,
      commitment
    );
  }
}

export function asArray<T>(arg: T | T[]): T[] {
  if (Array.isArray(arg)) {
    return arg
  }

  return [arg]
}
