import {
  CLAIM_REQUEST_SEED, EntryData, ENTRY_SEED, NamespaceData,
  NAMESPACES_IDL,
  NAMESPACES_PROGRAM,
  NAMESPACES_PROGRAM_ID,
  NAMESPACE_SEED,
  withClaimNameEntry,
  withCreateClaimRequest, withInitNameEntry, withInitNameEntryMint,
} from "@cardinal/namespaces";
import {
  Metadata,
  MasterEdition,
} from "@metaplex-foundation/mpl-token-metadata";
import { AnchorProvider, BN as AnchorBN, IdlTypes, Program, utils } from "@project-serum/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Commitment, ConfirmedTransactionMeta, Finality, Keypair, Message, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
import {
  AnchorSdk,
  BigInstructionResult,
  getMintInfo,
  InstructionResult,
  toBN,
  truthy,
  TypedAccountParser
} from "@strata-foundation/spl-utils";
import BN from "bn.js";
// @ts-ignore
import * as bs58 from "bs58";
// @ts-ignore
import LitJsSdk from "lit-js-sdk";
// @ts-ignore
import { v4 as uuid } from "uuid";
import { ChatIDL, ChatV0, DelegateWalletV0, NamespacesV0, PostAction, ProfileV0 } from "./generated/chat";
import { uploadFile } from "./shdw";

const MESSAGE_MAX_CHARACTERS = 352; // TODO: This changes with optional accounts in the future

export * from "./generated/chat";
export * from "./shdw";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

interface SymKeyInfo {
  encryptedSymKey: string;
  symKey: string;
  timeMillis: number;
}

interface ISymKeyStorage {
  setSymKeyToUse(
    mintOrCollection: PublicKey,
    amount: number,
    key: SymKeyInfo
  ): void;
  getSymKeyToUse(
    mintOrCollection: PublicKey,
    amount: number
  ): SymKeyInfo | null;
  setSymKey(encrypted: string, unencrypted: string): void;
  getSymKey(encrypted: string): string | null;
  getTimeSinceLastSet(
    mintOrCollection: PublicKey,
    amount: number
  ): number | null;
}

const storage =
  typeof localStorage !== "undefined"
    ? localStorage
    : require("localstorage-memory");

// 3 hours
const KEY_EXPIRY = 3 * 60 * 60 * 1000;

export class LocalSymKeyStorage implements ISymKeyStorage {
  setSymKey(encrypted: string, unencrypted: string): void {
    storage.setItem("enc" + encrypted, unencrypted);
  }
  getSymKey(encrypted: string): string | null {
    return storage.getItem("enc" + encrypted);
  }
  private getKey(mintOrCollection: PublicKey, amount: number): string {
    return `sym-${mintOrCollection.toBase58()}-${amount}`;
  }
  setSymKeyToUse(
    mintOrCollection: PublicKey,
    amount: number,
    symKey: SymKeyInfo
  ): void {
    const key = this.getKey(mintOrCollection, amount);
    storage.setItem(key, JSON.stringify(symKey));
  }
  getTimeSinceLastSet(
    mintOrCollection: PublicKey,
    amount: number
  ): number | null {
    const item = storage.getItem(this.getKey(mintOrCollection, amount));

    if (item) {
      return new Date().valueOf() - JSON.parse(item).timeMillis;
    }
    return null;
  }
  getSymKeyToUse(mintOrCollection: PublicKey, amount: number): SymKeyInfo | null {
    const aDayAgo = new Date();
    aDayAgo.setDate(aDayAgo.getDate() - 1);
    const lastSet = this.getTimeSinceLastSet(mintOrCollection, amount);
    if (!lastSet) {
      return null;
    }

    if (lastSet > KEY_EXPIRY) {
      return null;
    }

    const item = storage.getItem(this.getKey(mintOrCollection, amount));
    if (item) {
      return JSON.parse(item);
    }

    return null;
  }
}


const SYMM_KEY_ALGO_PARAMS = {
  name: "AES-CBC",
  length: 256,
};

async function generateSymmetricKey(): Promise<CryptoKey> {
  const symmKey = await crypto.subtle.generateKey(SYMM_KEY_ALGO_PARAMS, true, [
    "encrypt",
    "decrypt",
  ]);
  return symmKey;
}

export async function importSymmetricKey(symmKey: BufferSource): Promise<CryptoKey> {
  const importedSymmKey = await crypto.subtle.importKey(
    "raw",
    symmKey,
    SYMM_KEY_ALGO_PARAMS,
    true,
    ["encrypt", "decrypt"]
  );
  return importedSymmKey;
}

export function exportSymmetricKey(symmKey: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey("raw", symmKey);
}

export enum MessageType {
  Text = "text",
  Html = "html",
  Gify = "gify",
  Image = "image",
  React = "react" // An emoji react to another message
}

export interface INamespaces extends NamespacesV0 {
  publicKey: PublicKey;
  chat: NamespaceData;
  user: NamespaceData;
}

export interface ReactMessage {
  referenceMessageId: string; // For reacts, they reference another message
  emoji: string; // The unicode emoji
}

export interface TextMessage {
  text: string;
}

export interface HtmlMessage {
  html: string;
}

export interface ImageMessage {
  attachments: string[];
  encryptedAttachments: string[];
}

export interface GifyMessage {
  gifyId: string;
}

export interface IMessageContent extends Partial<ReactMessage>, Partial<TextMessage>, Partial<HtmlMessage>, Partial<ImageMessage>, Partial<GifyMessage> {
  type: MessageType;
}

export interface IDecryptedMessageContent extends IMessageContent {
  decryptedAttachments?: Blob[];
}

export interface ISendMessageContent extends IMessageContent {
  fileAttachments?: File[];
}

export interface IDelegateWallet extends DelegateWalletV0 {
  publicKey: PublicKey;
}

export interface IChat extends ChatV0 {
  publicKey: PublicKey;
}

export interface IEntry extends EntryData {
  publicKey: PublicKey;
  mint: PublicKey;
}

export interface IProfile extends ProfileV0 {
  publicKey: PublicKey;
}

type MessagePartV0 = IdlTypes<ChatIDL>["MessagePartV0"];
export interface IMessagePart extends MessagePartV0 {
  txid: string;
  blockTime: number;
  profileKey: PublicKey;
  chatKey: PublicKey;
}

export interface IMessage {
  id: string;
  txids: string[];
  startBlockTime: number;
  endBlockTime: number;
  readPermissionAmount: BN;

  encryptedSymmetricKey: string;

  content: string;
  /** Decoded message, if permissions were enough to decode it */
  decodedMessage?: IDecryptedMessageContent;

  profileKey: PublicKey;
  chatKey: PublicKey;

  parts: IMessagePart[]
}

export interface InitializeChatArgs {
  payer?: PublicKey;
  /** The admin of this chat instance. **Default:** This wallet */
  admin?: PublicKey;
  /** The unique shortname of the chat. This is a cardinal certificate NFT */
  identifierCertificateMint: PublicKey;
  /** Human readable name for the chat */
  name: string;
  /** The mint you need to read this chat */
  readPermissionMintOrCollection: PublicKey;
  /** The mint you need to post to this chat */
  postPermissionMintOrCollection: PublicKey;
  /** The number of tokens needed to post to this chat. **Default:** 1 */
  postPermissionAmount?: number | BN;
  /** The action to take when posting. **Default:** hold */
  postPermissionAction?: PostAction;
  /** Amount of read permission mint required to read this chat by default. **Default:** 1 */
  defaultReadPermissionAmount?: any;
  /** The destination to pay to on post */
  postPayDestination?: PublicKey;
  imageUrl?: string;
  metadataUrl?: string;
}

export interface InitializeProfileArgs {
  payer?: PublicKey;
  /** The owner of this profile. **Default:** the current wallet */
  ownerWallet?: PublicKey;
  /** The unique shortname of the user. This is a cardinal certificate NFT */
  identifierCertificateMint: PublicKey;
  /** Useful when metadata is being created in the same instruction set, short circuit call to get metadata for the identifier. **Default:** metadata of certificate mint name */
  identifier?: string;
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
  /** The message to send */
  message: ISendMessageContent;

  /** The amount of tokens needed to read. **Default:** from chat */
  readPermissionAmount?: number;

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

export enum IdentifierType {
  Chat = "chat",
  User = "me"
}

export interface ClaimIdentifierArgs {
  payer?: PublicKey;
  /** The wallet to own this. **Default:** this wallet */
  owner?: PublicKey;
  type: IdentifierType;
  identifier: string;
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
  authingLit: Promise<void> | null;
  symKeyStorage: ISymKeyStorage;

  namespacesProgram: Program<NAMESPACES_PROGRAM>;

  static ID = new PublicKey("chatGL6yNgZT2Z3BeMYGcgdMpcBKdmxko4C5UhEX4To");

  get isLitAuthed() {
    return Boolean(this.litAuthSig);
  }

  async _litAuth() {
    try {
      this.litAuthSig = await LitJsSdk.checkAndSignAuthMessage({
        chain: this.chain,
        alertWhenUnauthorized: false,
      });
    } finally {
      this.authingLit = null;
    }
  }

  async litAuth() {
    await this.authingLit;
    if (!this.isLitAuthed && !this.authingLit) {
      this.authingLit = this._litAuth();
    }

    return this.authingLit;
  }

  async getNamespace(namespace: PublicKey): Promise<NamespaceData> {
    return (await this.namespacesProgram.account.namespace.fetch(
      namespace
    )) as NamespaceData;
  }

  static async init(
    provider: AnchorProvider,
    chatProgramId: PublicKey = ChatSdk.ID
  ): Promise<ChatSdk> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const namespacesProgram = new Program<NAMESPACES_PROGRAM>(
      NAMESPACES_IDL,
      NAMESPACES_PROGRAM_ID,
      provider
    );

    const ChatIDLJson = await Program.fetchIdl(chatProgramId, provider);
    const chat = new Program<ChatIDL>(
      ChatIDLJson as ChatIDL,
      chatProgramId,
      provider
    ) as Program<ChatIDL>;
    const client = new LitJsSdk.LitNodeClient({
      alertWhenUnauthorized: false,
    });
    await client.connect();

    return new this({
      provider,
      program: chat,
      litClient: client,
      namespacesProgram,
    });
  }

  constructor({
    provider,
    program,
    litClient,
    namespacesProgram,
    symKeyStorage = new LocalSymKeyStorage(),
  }: {
    provider: AnchorProvider;
    program: Program<ChatIDL>;
    litClient: LitJsSdk;
    namespacesProgram: Program<NAMESPACES_PROGRAM>;
    symKeyStorage?: ISymKeyStorage;
  }) {
    super({ provider, program });

    this.namespacesProgram = namespacesProgram;

    this.authingLit = null;

    // @ts-ignore
    if (provider.connection._rpcEndpoint.includes("dev")) {
      this.chain = "solanaDevnet";
    } else {
      this.chain = "solana";
    }
    this.litClient = litClient;
    this.symKeyStorage = symKeyStorage;
  }

  entryDecoder: TypedAccountParser<IEntry> = (pubkey, account) => {
    const coded = this.namespacesProgram.coder.accounts.decode<IEntry>(
      "entry",
      account.data
    );

    return {
      ...coded,
      publicKey: pubkey,
    };
  };

  chatDecoder: TypedAccountParser<IChat> = (pubkey, account) => {
    const coded = this.program.coder.accounts.decode<IChat>(
      "ChatV0",
      account.data
    );

    return {
      ...coded,
      name: depuff(coded.name),
      imageUrl: depuff(coded.imageUrl),
      metadataUrl: depuff(coded.metadataUrl),
      publicKey: pubkey,
    };
  };

  delegateWalletDecoder: TypedAccountParser<IDelegateWallet> = (
    pubkey,
    account
  ) => {
    const coded = this.program.coder.accounts.decode<IDelegateWallet>(
      "DelegateWalletV0",
      account.data
    );

    return {
      ...coded,
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

  async getDecodedMessagesFromParts(
    parts: IMessagePart[],
    ignorePartial: boolean = true
  ): Promise<IMessage[]> {
    const partsById = parts.reduce((acc, part) => {
      acc[part.id] = acc[part.id] || [];
      acc[part.id].push(part);
      return acc;
    }, {} as Record<string, IMessagePart[]>);

    const messages = await Promise.all(
      Object.values(partsById).map((parts) =>
        this.getDecodedMessageFromParts(parts, ignorePartial)
      )
    );

    return messages
      .filter(truthy)
      .sort((a, b) => a.startBlockTime - b.startBlockTime);
  }

  async getDecodedMessageFromParts(
    parts: IMessagePart[],
    ignorePartial: boolean = true
  ): Promise<IMessage | undefined> {
    if (ignorePartial && parts.length !== parts[0].totalParts) {
      return undefined;
    }

    const content = parts
      .sort((a, b) => a.currentPart - b.currentPart)
      .map((part) => part.content)
      .join("");
    const { readPermissionAmount, chatKey, encryptedSymmetricKey, ...rest } =
      parts[0];
    const chatAcc = await this.getChat(chatKey);
    const readMint = await getMintInfo(
      this.provider,
      chatAcc!.readPermissionMintOrCollection
    );

    let decodedMessage;
    if (encryptedSymmetricKey) {
      const accessControlConditions = [
        tokenAccessPermissions(
          chatAcc!.readPermissionMintOrCollection,
          toBN(readPermissionAmount, readMint),
          this.chain
        ),
      ];

      try {
        const storedKey = this.symKeyStorage.getSymKey(encryptedSymmetricKey);
        let symmetricKey: Uint8Array | undefined = storedKey
          ? Buffer.from(storedKey, "hex")
          : undefined;
        if (!symmetricKey) {
          await this.authingLit;
          if (!this.isLitAuthed && this.wallet && this.wallet.publicKey) {
            await this.litAuth();
          }
          symmetricKey = await this.litClient.getEncryptionKey({
            solRpcConditions: accessControlConditions,
            // Note, below we convert the encryptedSymmetricKey from a UInt8Array to a hex string.  This is because we obtained the encryptedSymmetricKey from "saveEncryptionKey" which returns a UInt8Array.  But the getEncryptionKey method expects a hex string.
            toDecrypt: encryptedSymmetricKey,
            chain: this.chain,
            authSig: this.litAuthSig,
          });
          const symKeyStr = Buffer.from(symmetricKey!).toString("hex");
          this.symKeyStorage.setSymKey(encryptedSymmetricKey, symKeyStr);
        }

        const blob = new Blob([
          LitJsSdk.uint8arrayFromString(content, "base16"),
        ]);
        decodedMessage = JSON.parse(
          await LitJsSdk.decryptString(blob, symmetricKey)
        );

        decodedMessage.decryptedAttachments = [];
        decodedMessage.decryptedAttachments.push(
          ...(await Promise.all(
            (decodedMessage.encryptedAttachments || []).map(
              async (encryptedAttachment: string) => {
                const blob = await fetch(encryptedAttachment).then((r) =>
                  r.blob()
                );
                const arrBuffer = await LitJsSdk.decryptFile({
                  symmetricKey,
                  file: blob,
                });
                return new Blob([arrBuffer]);
              }
            )
          ))
        );
      } catch (e: any) {
        console.error("Failed to decode message", e);
      }
    } else {
      decodedMessage = JSON.parse(content);
    }

    return {
      ...rest,
      encryptedSymmetricKey,
      startBlockTime: parts[0].blockTime,
      endBlockTime: parts[parts.length - 1].blockTime,
      txids: parts.map((part) => part.txid),
      readPermissionAmount,
      content,
      chatKey,
      decodedMessage,
      parts,
    };
  }

  async getMessagePartsFromInflatedTx({
    transaction,
    txid,
    meta,
    blockTime,
  }: {
    transaction: { message: Message; signatures: string[] };
    txid: string;
    meta?: ConfirmedTransactionMeta | null;
    blockTime?: number | null;
  }): Promise<IMessagePart[]> {
    if (meta?.err) {
      return [];
    }

    const instructions = transaction.message.instructions.filter((ix) =>
      ensurePubkey(transaction.message.accountKeys[ix.programIdIndex]).equals(this.programId)
    );
    const coder = this.program.coder.instruction;

    const sendMessageIdl = this.program.idl.instructions.find(
      (i: any) => i.name === "sendTokenMessageV0"
    )!;
    const profileAccountIndex = sendMessageIdl.accounts.findIndex(
      (account: any) => account.name === "profile"
    );
    const chatAccountIndex = sendMessageIdl.accounts.findIndex(
      (account: any) => account.name === "chat"
    );
    const decoded = instructions
      .map((ix) => ({
        // @ts-ignore
        data: coder.decode(bs58.decode(ix.data)),
        profile: ensurePubkey(
          transaction.message.accountKeys[ix.accounts[profileAccountIndex]]
        ),
        chat: ensurePubkey(transaction.message.accountKeys[
          ix.accounts[chatAccountIndex]
        ]),
      }))
      .filter(truthy);

    return Promise.all(
      decoded
        .filter((decoded) => decoded.data.name === "sendTokenMessageV0")
        .map(async (decoded) => {
          const args = decoded.data.data.args;

          return {
            ...args,
            blockTime,
            txid,
            chatKey: decoded.chat,
            profileKey: decoded.profile,
          };
        })
    );
  }

  async getMessagePartsFromTx(txid: string): Promise<IMessagePart[]> {
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

    return this.getMessagePartsFromInflatedTx({
      transaction: tx.transaction,
      txid,
      meta: tx.meta,
      blockTime: tx.blockTime,
    });
  }

  static chatKey(
    identifierCertificateMint: PublicKey,
    programId: PublicKey = ChatSdk.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from("chat", "utf-8"), identifierCertificateMint.toBuffer()],
      programId
    );
  }

  static entryKey(
    namespaceId: PublicKey,
    identifier: string
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [
        utils.bytes.utf8.encode(ENTRY_SEED),
        namespaceId.toBytes(),
        utils.bytes.utf8.encode(identifier),
      ],
      NAMESPACES_PROGRAM_ID
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
    wallet: PublicKey,
    programId: PublicKey = ChatSdk.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from("wallet_profile", "utf-8"), wallet.toBuffer()],
      programId
    );
  }

  static namespacesKey(
    programId: PublicKey = ChatSdk.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from("namespaces", "utf-8")],
      programId
    );
  }

  async initializeNamespacesInstructions(): Promise<InstructionResult<null>> {
    try {
      await this.getNamespaces();
      return {
        instructions: [],
        signers: [],
        output: null,
      };
    } catch (e: any) {
      // This is expected
    }

    const [namespaces] = await ChatSdk.namespacesKey();
    const [chatNamespace, chatNamespaceBump] =
      await PublicKey.findProgramAddress(
        [
          utils.bytes.utf8.encode(NAMESPACE_SEED),
          utils.bytes.utf8.encode(IdentifierType.Chat),
        ],
        NAMESPACES_PROGRAM_ID
      );
    const [userNamespace, userNamespaceBump] =
      await PublicKey.findProgramAddress(
        [
          utils.bytes.utf8.encode(NAMESPACE_SEED),
          utils.bytes.utf8.encode(IdentifierType.User),
        ],
        NAMESPACES_PROGRAM_ID
      );

    const instructions = [];
    instructions.push(
      await this.program.instruction.initializeNamespacesV0(
        {
          chatNamespaceName: IdentifierType.Chat,
          userNamespaceName: IdentifierType.User,
          chatNamespaceBump,
          userNamespaceBump,
        },
        {
          accounts: {
            payer: this.wallet.publicKey,
            namespaces,
            namespacesProgram: NAMESPACES_PROGRAM_ID,
            chatNamespace,
            userNamespace,
            systemProgram: SystemProgram.programId,
          },
        }
      )
    );

    return {
      instructions,
      signers: [],
      output: null,
    };
  }

  async initializeNamespaces(): Promise<null> {
    return this.execute(
      this.initializeNamespacesInstructions(),
      this.wallet.publicKey,
      "confirmed"
    );
  }

  async getNamespaces(): Promise<INamespaces> {
    const key = (await ChatSdk.namespacesKey(this.programId))[0];
    const namespaces = await this.program.account.namespacesV0.fetch(key);

    return {
      ...namespaces,
      publicKey: key,
      chat: await this.getNamespace(namespaces.chatNamespace),
      user: await this.getNamespace(namespaces.userNamespace),
    };
  }

  /**
   * Attempt to claim the identifier. If the identifier entry already exists, attempt to approve/claim.
   * @param param0
   * @returns
   */
  async claimIdentifierInstructions({
    payer = this.wallet.publicKey,
    owner = this.wallet.publicKey,
    identifier,
    type,
  }: ClaimIdentifierArgs): Promise<
    BigInstructionResult<{ certificateMint: PublicKey }>
  > {
    const transaction = new Transaction();
    const certificateMintKeypair = Keypair.generate();
    console.log("cert", certificateMintKeypair.publicKey.toBase58())
    let signers = [];
    let certificateMint = certificateMintKeypair.publicKey;
    const namespaces = await this.getNamespaces();

    let namespaceName: string;
    let namespaceId: PublicKey;
    if (type === IdentifierType.Chat) {
      namespaceName = namespaces.chat.name;
      namespaceId = namespaces.chatNamespace;
    } else {
      namespaceName = namespaces.user.name;
      namespaceId = namespaces.userNamespace;
    }

    const [entryId] = await ChatSdk.entryKey(namespaceId, identifier);
    const existingEntry =
      await this.namespacesProgram.account.entry.fetchNullable(entryId);
    if (!existingEntry) {
      await withInitNameEntry(
        transaction,
        this.provider.connection,
        this.provider.wallet,
        namespaceName,
        identifier,
      );
      signers.push(certificateMintKeypair);
      await withInitNameEntryMint(
        transaction,
        this.provider.connection,
        this.provider.wallet,
        namespaceName,
        identifier,
        certificateMintKeypair
      )
    } else {
      certificateMint = existingEntry.mint;
      signers = [];
    }

    const [claimRequestId] = await PublicKey.findProgramAddress(
      [
        utils.bytes.utf8.encode(CLAIM_REQUEST_SEED),
        namespaceId.toBytes(),
        utils.bytes.utf8.encode(identifier),
        owner.toBytes(),
      ],
      NAMESPACES_PROGRAM_ID
    );

    if (!(await this.provider.connection.getAccountInfo(claimRequestId))) {
      await withCreateClaimRequest(
        this.provider.connection,
        this.provider.wallet,
        namespaceName,
        identifier,
        owner,
        transaction
      );
    }

    const instructions = transaction.instructions;

    const certificateMintMetadata = await Metadata.getPDA(certificateMint);

    if (type === IdentifierType.Chat && !existingEntry?.isClaimed) {
      instructions.push(
        await this.program.instruction.approveChatIdentifierV0({
          accounts: {
            namespaces: namespaces.publicKey,
            chatNamespace: namespaces.chatNamespace,
            claimRequest: claimRequestId,
            entry: entryId,
            certificateMintMetadata,
            namespacesProgram: NAMESPACES_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          },
        })
      );
    } else if (!existingEntry?.isClaimed) {
      instructions.push(
        await this.program.instruction.approveUserIdentifierV0({
          accounts: {
            namespaces: namespaces.publicKey,
            userNamespace: namespaces.userNamespace,
            claimRequest: claimRequestId,
            entry: entryId,
            certificateMintMetadata,
            namespacesProgram: NAMESPACES_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          },
        })
      );
    }

    const tx2 = new Transaction();
    if (!existingEntry?.isClaimed) {
      await withClaimNameEntry(
        tx2,
        this.provider.connection,
        {
          ...this.provider.wallet,
          publicKey: owner
        },
        namespaceName,
        identifier,
        certificateMint,
        0,
        owner,
        payer
      );
    }

    return {
      instructions: [instructions, tx2.instructions],
      signers: [signers, []],
      output: { certificateMint },
    };
  }

  async claimIdentifier(
    args: ClaimIdentifierArgs,
    commitment?: Finality
  ): Promise<{ certificateMint: PublicKey }> {
    return this.executeBig(
      this.claimIdentifierInstructions(args),
      args.payer,
      commitment
    );
  }

  async initializeChatInstructions({
    payer = this.wallet.publicKey,
    identifierCertificateMint,
    name,
    readPermissionMintOrCollection,
    postPermissionMintOrCollection,
    postPermissionAction = PostAction.Hold,
    postPayDestination,
    postPermissionAmount = 1,
    defaultReadPermissionAmount = 1,
    imageUrl = "",
    metadataUrl = "",
  }: InitializeChatArgs): Promise<InstructionResult<{ chat: PublicKey }>> {
    const chat = (
      await ChatSdk.chatKey(identifierCertificateMint, this.programId)
    )[0];
    const postMint = await getMintInfo(
      this.provider,
      postPermissionMintOrCollection
    );
    const readMint = await getMintInfo(
      this.provider,
      readPermissionMintOrCollection
    );

    const metadataKey = await Metadata.getPDA(identifierCertificateMint);
    const metadata = await new Metadata(
      metadataKey,
      (await this.provider.connection.getAccountInfo(metadataKey))!
    );
    const namespaces = await this.getNamespaces();
    const [entryName] = metadata.data.data.name.split(".");
    const [entry] = await await ChatSdk.entryKey(
      namespaces.chatNamespace,
      entryName
    );

    const identifierCertificateMintAccount =
      await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        identifierCertificateMint,
        this.wallet.publicKey,
        true
      );

    const instruction = await this.instruction.initializeChatV0(
      {
        name,
        imageUrl: imageUrl,
        metadataUrl: metadataUrl,
        defaultReadPermissionAmount: toBN(
          defaultReadPermissionAmount,
          readMint
        ) as AnchorBN,
        postPermissionMintOrCollection,
        readPermissionMintOrCollection,
        postPermissionAction: postPermissionAction as never,
        postPermissionAmount: toBN(postPermissionAmount, postMint) as AnchorBN,
        postPayDestination: postPayDestination || null,
      },
      {
        accounts: {
          payer,
          chat,
          namespaces: namespaces.publicKey,
          entry,
          identifierCertificateMint,
          identifierCertificateMintAccount,
          ownerWallet: this.wallet.publicKey,
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
    identifierCertificateMint,
    identifier,
    imageUrl = "",
    metadataUrl = "",
  }: InitializeProfileArgs): Promise<
    InstructionResult<{
      walletProfile: PublicKey;
    }>
  > {
    const instructions = [];

    const walletProfile = (
      await ChatSdk.profileKey(ownerWallet, this.programId)
    )[0];

    const namespaces = await this.getNamespaces();
    const metadataKey = await Metadata.getPDA(identifierCertificateMint);
    if (!identifier) {
      const metadata = await new Metadata(
        metadataKey,
        (await this.provider.connection.getAccountInfo(metadataKey))!
      );
      const [entryName] = metadata.data.data.name.split(".");
      identifier = entryName;
    }

    const [entry] = await ChatSdk.entryKey(
      namespaces.userNamespace,
      identifier
    );

    const identifierCertificateMintAccount =
      await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        identifierCertificateMint,
        ownerWallet,
        true
      );

    instructions.push(
      await this.instruction.initializeProfileV0(
        {
          imageUrl,
          metadataUrl,
        },
        {
          accounts: {
            payer,
            walletProfile,
            namespaces: namespaces.publicKey,
            entry,
            identifierCertificateMint,
            identifierCertificateMintAccount,
            ownerWallet,
            systemProgram: SystemProgram.programId,
          },
        }
      )
    );

    return {
      output: {
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
    args: InitializeDelegateWalletArgs,
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
    readPermissionAmount,
    delegateWallet,
    delegateWalletKeypair,
    encrypted = true,
  }: SendMessageArgs): Promise<BigInstructionResult<{ messageId: string }>> {
    if (encrypted) {
      await this.authingLit;
      if (!this.isLitAuthed && this.wallet && this.wallet.publicKey) {
        await this.litAuth();
      }
    }
    let { fileAttachments, ...normalMessage } = message;

    const chatAcc = (await this.getChat(chat))!;
    const readMint = await getMintInfo(
      this.provider,
      chatAcc.readPermissionMintOrCollection
    );

    const readAmount = toBN(
      readPermissionAmount || chatAcc.defaultReadPermissionAmount,
      readMint
    );
    const accessControlConditionsToUse = [
      tokenAccessPermissions(
        chatAcc.readPermissionMintOrCollection,
        readAmount,
        this.chain
      ),
    ];

    const storedSymKey = this.symKeyStorage.getSymKeyToUse(
      chatAcc.readPermissionMintOrCollection,
      readAmount.toNumber()
    );
    let symmKey: any;
    if (encrypted) {
      if (storedSymKey) {
        symmKey = await importSymmetricKey(
          Buffer.from(storedSymKey.symKey, "hex")
        );
      } else {
        symmKey = await generateSymmetricKey();
      }
    }
    // Encrypt fileAttachements if needed
    if (fileAttachments && encrypted) {
      fileAttachments = await Promise.all(
        fileAttachments.map(async (fileAttachment) => {
          const encrypted = await LitJsSdk.encryptWithSymmetricKey(
            symmKey,
            await fileAttachment.arrayBuffer()
          );
          return new File([encrypted], fileAttachment.name + ".encrypted");
        })
      );
    }

    // Attach files to either attachments or encryptedAttachments based on whether they were encrypted
    if (fileAttachments) {
      let attachments: string[];
      if (encrypted) {
        normalMessage.encryptedAttachments =
          normalMessage.encryptedAttachments || [];
        attachments = normalMessage.encryptedAttachments;
      } else {
        normalMessage.attachments = normalMessage.attachments || [];
        attachments = normalMessage.attachments;
      }

      attachments.push(
        ...(
          await Promise.all(
            fileAttachments.map(async (fileAttachment) => {
              return await uploadFile(
                this.provider,
                fileAttachment,
                delegateWalletKeypair
              );
            })
          )
        ).filter(truthy)
      );
    }

    // Encrypt the actual json structure
    let encryptedSymmetricKey, encryptedString;
    if (encrypted) {
      const encryptedStringOut = await LitJsSdk.encryptWithSymmetricKey(
        symmKey,
        LitJsSdk.uint8arrayFromString(JSON.stringify(normalMessage))
      );
      encryptedString = buf2hex(
        await (encryptedStringOut as Blob).arrayBuffer()
      );
      if (storedSymKey) {
        encryptedSymmetricKey = storedSymKey.encryptedSymKey;
      } else {
        // Cache the sym key we're using
        encryptedSymmetricKey = LitJsSdk.uint8arrayToString(
          await this.litClient.saveEncryptionKey({
            solRpcConditions: accessControlConditionsToUse,
            symmetricKey: new Uint8Array(
              await crypto.subtle.exportKey("raw", symmKey)
            ),
            authSig: this.litAuthSig,
            chain: this.chain,
          }),
          "base16"
        );
        this.symKeyStorage.setSymKeyToUse(
          chatAcc.readPermissionMintOrCollection,
          readAmount.toNumber(),
          {
            symKey: Buffer.from(await exportSymmetricKey(symmKey)).toString(
              "hex"
            ),
            encryptedSymKey: encryptedSymmetricKey,
            timeMillis: new Date().valueOf(),
          }
        );
      }
    } else {
      encryptedSymmetricKey = "";
      encryptedString = JSON.stringify(message);
    }

    const profile = (await ChatSdk.profileKey(sender, this.programId))[0];
    const profileAcc = (await this.getProfile(profile))!;

    const identifierCertificateMint = profileAcc.identifierCertificateMint;
    const metadataKey = await Metadata.getPDA(identifierCertificateMint);
    const metadata = await new Metadata(
      metadataKey,
      (await this.provider.connection.getAccountInfo(metadataKey))!
    );

    const identifierCertificateMintAccount =
      await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        identifierCertificateMint,
        profileAcc.ownerWallet,
        true
      );

    const postPermissionAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      chatAcc.postPermissionMintOrCollection,
      profileAcc.ownerWallet,
      true
    );

    const remainingAccounts = [];
    if (delegateWallet || delegateWalletKeypair) {
      if (!delegateWallet) {
        delegateWallet = delegateWalletKeypair!.publicKey;
      }

      remainingAccounts.push({
        pubkey: (
          await ChatSdk.delegateWalletKey(delegateWallet, this.programId)
        )[0],
        isWritable: false,
        isSigner: false,
      });
    }

    const senderToUse = delegateWallet || sender;

    const contentLength = encryptedString.length;
    const numGroups = Math.ceil(contentLength / MESSAGE_MAX_CHARACTERS);
    const instructionGroups = [];
    const signerGroups = [];
    const messageId = uuid();
    for (let i = 0; i < numGroups; i++) {
      const instructions = [];
      instructions.push(
        await this.instruction.sendTokenMessageV0(
          {
            id: messageId,
            content: encryptedString.slice(
              i * MESSAGE_MAX_CHARACTERS,
              (i + 1) * MESSAGE_MAX_CHARACTERS
            ),
            encryptedSymmetricKey,
            readPermissionAmount: toBN(
              readPermissionAmount || chatAcc.defaultReadPermissionAmount,
              readMint
            ),
            totalParts: numGroups,
            currentPart: i,
          },
          {
            accounts: {
              chat,
              sender: senderToUse,
              profile,
              postPermissionAccount,
              postPermissionMint: chatAcc.postPermissionMintOrCollection,
              identifierCertificateMint,
              identifierCertificateMintAccount,
              tokenProgram: TOKEN_PROGRAM_ID,
            },
            remainingAccounts,
          }
        )
      );
      instructionGroups.push(instructions);
      signerGroups.push([delegateWalletKeypair].filter(truthy));
    }

    return {
      instructions: instructionGroups,
      output: { messageId },
      signers: signerGroups,
    };
  }

  async sendMessage(
    args: SendMessageArgs,
    commitment: Finality = "confirmed"
  ): Promise<{
    txids?: string[];
    messageId: string;
  }> {
    return this.executeBig(
      this.sendMessageInstructions(args),
      args.payer,
      commitment
    );
  }
}

function tokenAccessPermissions(readPermissionMint: PublicKey, threshold: BN, chain: string) {
  return {
    method: "balanceOfToken",
    params: [
      readPermissionMint.toBase58()
    ],
    chain,
    returnValueTest: {
      key: `$.amount`,
      comparator: ">=",
      value: threshold.toString(10),
    },
  };
}

function buf2hex(buffer: ArrayBuffer): string {
  // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

function ensurePubkey(arg0: PublicKey | string) {
  if (typeof arg0 === "string") {
    return new PublicKey(arg0)
  }
  return arg0
}

