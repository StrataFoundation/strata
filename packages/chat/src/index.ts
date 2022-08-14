import { DataV2, Metadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  CLAIM_REQUEST_SEED,
  EntryData,
  ENTRY_SEED,
  NamespaceData,
  NAMESPACES_IDL,
  NAMESPACES_PROGRAM,
  NAMESPACES_PROGRAM_ID,
  NAMESPACE_SEED,
  withClaimNameEntry,
  withCreateClaimRequest,
  withInitNameEntry,
  withInitNameEntryMint,
} from "@cardinal/namespaces";
import { LocalStorageLRU } from "@cocalc/local-storage-lru";
import {
  AnchorProvider,
  BN as AnchorBN,
  EventParser,
  IdlTypes,
  Program,
  utils,
} from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Commitment,
  ConfirmedTransactionMeta,
  Finality,
  Keypair,
  Message,
  PublicKey,
  Signer,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  AnchorSdk,
  BigInstructionResult,
  getMintInfo,
  InstructionResult,
  toBN,
  truthy,
  TypedAccountParser,
  createMintInstructions,
  SplTokenMetadata,
} from "@strata-foundation/spl-utils";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import BN from "bn.js";
// @ts-ignore
import bs58 from "bs58";
// @ts-ignore
import LitJsSdk from "lit-js-sdk";
// @ts-ignore
import { v4 as uuid } from "uuid";
import {
  CaseInsensitiveMarkerV0,
  ChatIDL,
  ChatV0,
  DelegateWalletV0,
  NamespacesV0,
  PermissionType,
  PostAction,
  ProfileV0,
  SettingsV0,
  MessageType as RawMessageType,
  ChatPermissionsV0,
} from "./generated/chat";
import { getAuthSig, MessageSigner } from "./lit";
import { uploadFiles } from "./shdw";

const MESSAGE_MAX_CHARACTERS = 352; // TODO: This changes with optional accounts in the future

export { RawMessageType };
export * from "./generated/chat";
export * from "./shdw";
export * from "./lit";

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

const storage = new LocalStorageLRU();

// 3 hours
const KEY_EXPIRY = 3 * 60 * 60 * 1000;

const CONDITION_VERSION = 2;

export class LocalSymKeyStorage implements ISymKeyStorage {
  constructor(readonly url: string) {}

  setSymKey(encrypted: string, unencrypted: string): void {
    storage.set("enc" + CONDITION_VERSION + encrypted, unencrypted);
  }

  getSymKey(encrypted: string): string | null {
    return storage.get("enc" + CONDITION_VERSION + encrypted) as string | null;
  }
  private getKey(mintOrCollection: PublicKey, amount: number): string {
    return `sym-${CONDITION_VERSION}-${
      this.url
    }-${mintOrCollection.toBase58()}-${amount}`;
  }
  setSymKeyToUse(
    mintOrCollection: PublicKey,
    amount: number,
    symKey: SymKeyInfo
  ): void {
    const key = this.getKey(mintOrCollection, amount);
    storage.set(key, JSON.stringify(symKey));
  }
  getTimeSinceLastSet(
    mintOrCollection: PublicKey,
    amount: number
  ): number | null {
    const item = storage.get(this.getKey(mintOrCollection, amount)) as string;

    if (item) {
      return new Date().valueOf() - JSON.parse(item).timeMillis;
    }
    return null;
  }
  getSymKeyToUse(
    mintOrCollection: PublicKey,
    amount: number
  ): SymKeyInfo | null {
    const aDayAgo = new Date();
    aDayAgo.setDate(aDayAgo.getDate() - 1);
    const lastSet = this.getTimeSinceLastSet(mintOrCollection, amount);
    if (!lastSet) {
      return null;
    }

    if (lastSet > KEY_EXPIRY) {
      return null;
    }

    const item = storage.get(this.getKey(mintOrCollection, amount)) as string;
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

export async function importSymmetricKey(
  symmKey: BufferSource
): Promise<CryptoKey> {
  // @ts-ignore
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
  React = "react", // An emoji react to another message
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
  encryptedAttachments: { name: string; file: string }[];
}

export interface ImageMessage {
  attachments: { name: string; file: string }[];
  encryptedAttachments: { name: string; file: string }[];
}

export interface GifyMessage {
  gifyId: string;
}

export interface IMessageContent
  extends Partial<ReactMessage>,
    Partial<TextMessage>,
    Partial<HtmlMessage>,
    Partial<ImageMessage>,
    Partial<GifyMessage> {
  type: MessageType;
  referenceMessageId?: string;
}

const PROGRAM_LOG = "Program log: ";
const PROGRAM_DATA = "Program data: ";
const PROGRAM_LOG_START_INDEX = PROGRAM_LOG.length;
const PROGRAM_DATA_START_INDEX = PROGRAM_DATA.length;


export interface IDecryptedMessageContent extends IMessageContent {
  decryptedAttachments?: { name: string; file: Blob }[];
}

export interface ISendMessageContent extends IMessageContent {
  fileAttachments?: { name: string; file: File }[];
}

export interface IDelegateWallet extends DelegateWalletV0 {
  publicKey: PublicKey;
}

export interface IChat extends ChatV0 {
  publicKey: PublicKey;
}

export interface IChatPermissions extends ChatPermissionsV0 {
  publicKey: PublicKey;
}

export interface IEntry extends EntryData {
  publicKey: PublicKey;
  mint: PublicKey;
}

export interface IProfile extends ProfileV0 {
  publicKey: PublicKey;
}

export interface ISettings extends SettingsV0 {
  getDelegateWalletSeed(): Promise<string>;
}

export interface ICaseInsensitiveMarker extends CaseInsensitiveMarkerV0 {
  publicKey: PublicKey;
}

type MessagePartV0 = IdlTypes<ChatIDL>["MessagePartV0"];
export interface IMessagePart extends MessagePartV0 {
  txid: string;
  blockTime: number;
  sender: PublicKey;
  chatKey: PublicKey;
}

export interface IMessage {
  type: MessageType;
  complete: boolean;
  id: string;
  txids: string[];
  startBlockTime: number;
  endBlockTime: number;
  readPermissionType: PermissionType;
  readPermissionKey: PublicKey;
  readPermissionAmount: BN;
  referenceMessageId: string | null;

  encryptedSymmetricKey: string;

  content: string;

  getDecodedMessage(): Promise<IDecryptedMessageContent | undefined>;

  sender: PublicKey;
  chatKey: PublicKey;

  parts: IMessagePart[];
}

export interface InitializeChatArgs {
  payer?: PublicKey;
  /** The admin of this chat instance. **Default:** This wallet */
  admin?: PublicKey;
  /** The unique shortname of the chat. This is a cardinal certificate NFT. If this and identifier are not provided, will create an unidentifiedChat */
  identifierCertificateMint?: PublicKey;
  identifier?: string;
  /** If not providing an identifier, creates an unidentified chat using this keypair. **Default:** Generate new keypair */
  chatKeypair?: Keypair;
  /** Human readable name for the chat */
  name: string;
  imageUrl?: string;
  metadataUrl?: string;
  /**
   * The program id that we expect messages to come from. **Default: ** Chat program.
   * This is your hook to have custom post gating logic.
   */
  postMessageProgramId?: PublicKey;
  // If using default chat permissioning
  permissions?: {
    /** The mint you need to read this chat */
    readPermissionKey: PublicKey;
    /** The mint you need to post to this chat */
    postPermissionKey: PublicKey;
    /** The gating mechanism, part of an NFT collection or just holds the token. **Default:** Token */
    readPermissionType?: PermissionType;
    /** The gating mechanism, part of an NFT collection or just holds the token **Default:** Token */
    postPermissionType?: PermissionType;
    /** The number of tokens needed to post to this chat. **Default:** 1 */
    postPermissionAmount?: number | BN;
    /** The action to take when posting. **Default:** hold */
    postPermissionAction?: PostAction;
    /** Amount of read permission mint required to read this chat by default. **Default:** 1 */
    defaultReadPermissionAmount?: any;
    /** The destination to pay to on post */
    postPayDestination?: PublicKey;
  };
}

export interface CloseChatArgs {
  refund?: PublicKey;
  /** The chat to close */
  chat: PublicKey;
  /** The admin account, **Default:** this.wallet.publicKey */
  admin?: PublicKey;
}

export interface ClaimChatAdminArgs {
  /** The chat to close */
  chat: PublicKey;
  /** The admin account, **Default:** this.wallet.publicKey */
  admin?: PublicKey;
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

export interface InitializeSettingsArgs {
  payer?: PublicKey;
  /** The owner of this settings. **Default:** the current wallet */
  ownerWallet?: PublicKey;
  settings: {
    delegateWalletSeed: string;
  };
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

  /** The amount of tokens needed to read. **Default:** from chat permissions */
  readPermissionAmount?: number | BN;

  /** The read permission key (collection, token mint, etc). **Default:** from chat permissions */
  readPermissionKey?: PublicKey;

  /** The read permission key (collection, token mint, etc). **Default:** from chat permissions */
  readPermissionType?: PermissionType;

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

  /** If you need an nft to post the message, this should be the mint of the qualifying nft held by the sender */
  nftMint?: PublicKey;
}

export enum IdentifierType {
  Chat = "chat",
  User = "me",
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

interface ICreateMetadataForBondingArgs {
  /**
   * The update authority on the metadata created. **Default:** Seller
   */
  metadataUpdateAuthority?: PublicKey;
  /**
   * The token metadata for the marketplace item
   */
  metadata: DataV2;
  /**
   * Optionally, use this keypair to create the target mint
   */
  targetMintKeypair?: Keypair;
  /**
   * Decimals for the mint
   */
  decimals: number;
}

export class ChatSdk extends AnchorSdk<ChatIDL> {
  litClient: LitJsSdk;
  litAuthSig: any | undefined;
  chain: string;
  authingLit: Promise<void> | null;
  symKeyStorage: ISymKeyStorage;
  symKeyFetchCache: Record<string, Promise<Uint8Array | undefined>>;
  litJsSdk: LitJsSdk; // to use in nodejs, manually set this to the nodejs lit client. see tests for example
  namespacesProgram: Program<NAMESPACES_PROGRAM>;
  conditionVersion = CONDITION_VERSION;
  _namespaces: INamespaces | null = null;
  _namespacesPromise: Promise<INamespaces> | null = null;
  tokenBondingProgram: SplTokenBonding;
  tokenMetadataProgram: SplTokenMetadata;

  static ID = new PublicKey("chatGL6yNgZT2Z3BeMYGcgdMpcBKdmxko4C5UhEX4To");

  get isLitAuthed() {
    return Boolean(this.litAuthSig);
  }

  async _litAuth() {
    const cached = storage.get("lit-auth-sol-signature");
    const cachedDate = storage.get("lit-auth-sol-signature-date") || 0;
    const cachedAuthSig = JSON.parse(cached as string);
    if (!this.wallet || !this.wallet.publicKey) {
      return;
    }
    if (
      // TODO: When sigs expire enable this again
      // Number(cachedDate) >= new Date().valueOf() - 24 * 60 * 60 * 1000 &&
      this.wallet.publicKey.toBase58() === cachedAuthSig?.address
    ) {
      this.litAuthSig = cachedAuthSig;
      return;
    }
    try {
      // @ts-ignore
      if (!this.wallet.signMessage) {
        throw new Error(
          "This wallet does not support signMessage. Please use another wallet"
        );
      }
      this.litAuthSig = await getAuthSig(
        this.wallet.publicKey,
        // @ts-ignore
        this.wallet as MessageSigner
      );
      storage.set("lit-auth-sol-signature", JSON.stringify(this.litAuthSig));
      storage.set(
        "lit-auth-sol-signature-date",
        new Date().valueOf().toString()
      );
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
    chatProgramId: PublicKey = ChatSdk.ID,
    splTokenBondingProgramId: PublicKey = SplTokenBonding.ID
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

    const tokenMetadataProgram = await SplTokenMetadata.init(provider);
    const tokenBondingProgram = await SplTokenBonding.init(
      provider,
      splTokenBondingProgramId
    );

    const client = new LitJsSdk.LitNodeClient({
      alertWhenUnauthorized: false,
      debug: false,
    });

    try {
      await client.connect();
    } catch (e: any) {
      console.warn(e);
    }

    return new this({
      provider,
      program: chat,
      litClient: client,
      namespacesProgram,
      tokenBondingProgram,
      tokenMetadataProgram,
    });
  }

  constructor({
    provider,
    program,
    litClient,
    namespacesProgram,
    // @ts-ignore
    symKeyStorage = new LocalSymKeyStorage(provider.connection._rpcEndpoint),
    tokenBondingProgram,
    tokenMetadataProgram,
  }: {
    provider: AnchorProvider;
    program: Program<ChatIDL>;
    litClient: typeof LitJsSdk;
    namespacesProgram: Program<NAMESPACES_PROGRAM>;
    symKeyStorage?: ISymKeyStorage;
    tokenBondingProgram: SplTokenBonding;
    tokenMetadataProgram: SplTokenMetadata;
  }) {
    super({ provider, program });

    this.symKeyFetchCache = {};

    this.namespacesProgram = namespacesProgram;

    this.authingLit = null;

    // @ts-ignore
    const endpoint = provider.connection._rpcEndpoint;
    if (
      endpoint.includes("dev") ||
      endpoint.includes("local") ||
      endpoint.includes("127.0.0.1")
    ) {
      this.chain = "solanaDevnet";
    } else {
      this.chain = "solana";
    }
    this.litClient = litClient;
    this.symKeyStorage = symKeyStorage;
    this.litJsSdk = LitJsSdk;
    this.tokenBondingProgram = tokenBondingProgram;
    this.tokenMetadataProgram = tokenMetadataProgram;
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

  chatPermissionsDecoder: TypedAccountParser<IChatPermissions> = (
    pubkey,
    account
  ) => {
    const coded = this.program.coder.accounts.decode<IChatPermissions>(
      "ChatPermissionsV0",
      account.data
    );

    return {
      ...coded,
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

  settingsDecoder: TypedAccountParser<ISettings> = (pubkey, account) => {
    const coded = this.program.coder.accounts.decode<ISettings>(
      "SettingsV0",
      account.data
    );

    const that = this;

    return {
      ...coded,
      publicKey: pubkey,
      async getDelegateWalletSeed() {
        const symmetricKey = await that.getSymmetricKey(
          coded.encryptedSymmetricKey,
          [myWalletPermissions(coded.ownerWallet)]
        );
        return that.litJsSdk.decryptString(
          new Blob([
            that.litJsSdk.uint8arrayFromString(
              coded.encryptedDelegateWallet,
              "base16"
            ),
          ]),
          symmetricKey
        );
      },
    };
  };

  caseInsensitiveMarkerDecoder: TypedAccountParser<ICaseInsensitiveMarker> = (
    pubkey,
    account
  ) => {
    const coded = this.program.coder.accounts.decode<ICaseInsensitiveMarker>(
      "CaseInsensitiveMarkerV0",
      account.data
    );

    return {
      ...coded,
      publicKey: pubkey,
    };
  };

  getChat(chatKey: PublicKey): Promise<IChat | null> {
    return this.getAccount(chatKey, this.chatDecoder);
  }

  getChatPermissions(
    chatPermissionsKey: PublicKey
  ): Promise<IChatPermissions | null> {
    return this.getAccount(chatPermissionsKey, this.chatPermissionsDecoder);
  }

  getProfile(profileKey: PublicKey): Promise<IProfile | null> {
    return this.getAccount(profileKey, this.profileDecoder);
  }

  getSettings(settingsKey: PublicKey): Promise<ISettings | null> {
    return this.getAccount(settingsKey, this.settingsDecoder);
  }

  getCaseInsensitiveMarker(
    caseInsensitiveMarkerKey: PublicKey
  ): Promise<ICaseInsensitiveMarker | null> {
    return this.getAccount(
      caseInsensitiveMarkerKey,
      this.caseInsensitiveMarkerDecoder
    );
  }

  /**
   * Get messages from a bunch of parts. NOTE: It is highly reccommended you use accountFetchCache for efficiency.
   * @param parts
   * @param ignorePartial
   * @returns
   */
  getMessagesFromParts(
    parts: IMessagePart[],
    ignorePartial: boolean = true
  ): IMessage[] {
    const partsById = parts.reduce((acc, part) => {
      acc[part.id] = acc[part.id] || [];
      acc[part.id].push(part);
      return acc;
    }, {} as Record<string, IMessagePart[]>);

    const messages = Object.values(partsById).map((parts) =>
      this.getMessageFromParts(parts, ignorePartial)
    );

    return messages
      .filter(truthy)
      .sort((a, b) => a.startBlockTime - b.startBlockTime);
  }

  async _getSymmetricKey(
    encryptedSymmetricKey: string,
    accessControlConditions: any
  ): Promise<Uint8Array | undefined> {
    const storedKey = this.symKeyStorage.getSymKey(encryptedSymmetricKey);
    let symmetricKey: Uint8Array | undefined = storedKey
      ? Buffer.from(storedKey, "hex")
      : undefined;
    if (!symmetricKey) {
      await this.litAuth();
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

    delete this.symKeyFetchCache[encryptedSymmetricKey];

    return symmetricKey;
  }

  async getSymmetricKey(
    encryptedSymmetricKey: string,
    accessControlConditions: any
  ): Promise<Uint8Array | undefined> {
    // Cache promises so we don't fetch the same thing from lit multiple times
    if (!this.symKeyFetchCache[encryptedSymmetricKey]) {
      this.symKeyFetchCache[encryptedSymmetricKey] = this._getSymmetricKey(
        encryptedSymmetricKey,
        accessControlConditions
      );
    }

    return this.symKeyFetchCache[encryptedSymmetricKey];
  }

  /**
   * Get message from a bunch of parts. NOTE: It is highly reccommended you use accountFetchCache for efficiency.
   *
   * @param parts
   * @param ignorePartial
   * @returns
   */
  getMessageFromParts(
    parts: IMessagePart[],
    ignorePartial: boolean = true
  ): IMessage | undefined {
    if (parts.length == 0) {
      return undefined;
    }
    const incomplete = parts.length !== parts[0].totalParts;
    if (ignorePartial && incomplete) {
      return undefined;
    }

    const content = parts
      .sort((a, b) => a.currentPart - b.currentPart)
      .map((part) => part.content)
      .join("");

    const {
      messageType,
      readPermissionAmount,
      chatKey,
      encryptedSymmetricKey,
      referenceMessageId,
      readPermissionKey,
      readPermissionType,
      ...rest
    } = parts[0];

    let decodedMessage: any;
    return {
      ...rest,
      complete: !incomplete,
      referenceMessageId,
      type: messageType && (Object.keys(messageType as any)[0] as MessageType),
      encryptedSymmetricKey,
      startBlockTime: parts[0].blockTime,
      endBlockTime: parts[parts.length - 1].blockTime,
      txids: parts.map((part) => part.txid),
      readPermissionAmount,
      readPermissionKey,
      readPermissionType,
      content,
      chatKey,
      getDecodedMessage: async () => {
        if (decodedMessage) {
          return decodedMessage;
        }

        let readAmount: BN;
        try {
          const readMint = await getMintInfo(this.provider, readPermissionKey);
          readAmount = toBN(readPermissionAmount, readMint);
        } catch {
          readAmount = new BN(readPermissionAmount);
        }

        if (encryptedSymmetricKey) {
          await this.litAuth();
          const accessControlConditions = getAccessConditions(
            parts[0].conditionVersion,
            readPermissionKey,
            readAmount,
            this.chain,
            readPermissionType
          );

          try {
            const blob = new Blob([
              this.litJsSdk.uint8arrayFromString(content, "base16"),
            ]);
            const symmetricKey = await this.getSymmetricKey(
              encryptedSymmetricKey,
              accessControlConditions
            );
            decodedMessage = JSON.parse(
              await this.litJsSdk.decryptString(blob, symmetricKey)
            );

            decodedMessage.decryptedAttachments = [];
            decodedMessage.decryptedAttachments.push(
              ...(await Promise.all(
                (decodedMessage.encryptedAttachments || []).map(
                  async (
                    encryptedAttachment: { name: string; file: string } | string
                  ) => {
                    const blob = await fetch(
                      // @ts-ignore this is some legacy stuff where it could just be a url
                      encryptedAttachment.file || encryptedAttachment
                    ).then((r) => r.blob());
                    const arrBuffer = await this.litJsSdk.decryptFile({
                      symmetricKey,
                      file: blob,
                    });
                    return {
                      file: new Blob([arrBuffer]),
                      // @ts-ignore this is some legacy stuff where it could just be a url
                      name: encryptedAttachment.name || "Attachment",
                    };
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

        return decodedMessage;
      },
      parts,
    };
  }

  /**
   * Get message parts from a tx. NOTE: It is highly reccommended you use accountFetchCache for efficiency.
   * @param param0
   * @returns
   */
  async getMessagePartsFromInflatedTx({
    chat,
    txid,
    meta,
    blockTime,
    transaction,
    idl,
    logs = meta!.logMessages
  }: {
    logs?: string[],
    transaction?:  { message: Message; signatures: string[] };
    chat: PublicKey;
    txid: string;
    meta?: ConfirmedTransactionMeta | null;
    blockTime?: number | null;
    idl?: any;
  }): Promise<IMessagePart[]> {
    if (meta?.err) {
      return [];
    }

    const chatAcc = (await this.getChat(chat))!;
    if (!idl) {
      idl = await Program.fetchIdl(chatAcc.postMessageProgramId, this.provider);
    }

    if (!idl) {
      throw new Error("Chat only supports programs with published IDLs.");
    }

    // ensure all instructions are from the chat program id
    const rightProgram = !transaction || transaction.message.instructions.every((ix) =>
      ensurePubkey(transaction.message.accountKeys[ix.programIdIndex]).equals(
        chatAcc.postMessageProgramId
      )
    );
    if (!rightProgram) {
      return []
    }

    const program = new Program(
      idl,
      chatAcc.postMessageProgramId,
      this.provider
    );
    const coder = program.coder;
    const messages = logs.map((log) => {
      const logStr = log.startsWith(PROGRAM_LOG)
        ? log.slice(PROGRAM_LOG_START_INDEX)
        : log.slice(PROGRAM_DATA_START_INDEX);
      const event = coder.events.decode(logStr);
      return event;
    }).filter(truthy);

    return Promise.all(
      messages
        .filter((d) => d.name === "MessagePartEventV0")
        .map(async (msg) => {
          const decoded: any = msg.data;

          let sender = decoded.sender;

          return {
            ...decoded,
            ...decoded.message,
            blockTime,
            txid,
            chatKey: decoded.chat,
            sender,
          };
        })
    );
  }

  /**
   * Get message parts from a tx. NOTE: It is highly reccommended you use accountFetchCache for efficiency.
   *
   * @param txid
   * @returns
   */
  async getMessagePartsFromTx({
    chat,
    txid,
    idl,
  }: {
    chat: PublicKey;
    txid: string;
    idl?: any;
  }): Promise<IMessagePart[]> {
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
      chat,
      txid,
      meta: tx.meta,
      blockTime: tx.blockTime,
      idl,
    });
  }

  static chatKey(
    identifierCertificateMint: PublicKey,
    programId: PublicKey = ChatSdk.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [
        Buffer.from("identified-chat", "utf-8"),
        identifierCertificateMint.toBuffer(),
      ],
      programId
    );
  }

  static chatPermissionsKey(
    chat: PublicKey,
    programId: PublicKey = ChatSdk.ID
  ) {
    return PublicKey.findProgramAddress(
      [Buffer.from("permissions", "utf-8"), chat.toBuffer()],
      programId
    );
  }

  static caseInsensitiveMarkerKey(
    namespace: PublicKey,
    identifier: string,
    programId: PublicKey = ChatSdk.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [
        Buffer.from("case_insensitive", "utf-8"),
        namespace.toBuffer(),
        utils.bytes.utf8.encode(identifier.toLowerCase()),
      ],
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

  static settingsKey(
    wallet: PublicKey,
    programId: PublicKey = ChatSdk.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from("settings", "utf-8"), wallet.toBuffer()],
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

    const instructions: TransactionInstruction[] = [];
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

  async _getNamespaces(): Promise<INamespaces> {
    const key = (await ChatSdk.namespacesKey(this.programId))[0];
    const namespaces = await this.program.account.namespacesV0.fetch(key);

    return {
      ...namespaces,
      publicKey: key,
      chat: await this.getNamespace(namespaces.chatNamespace),
      user: await this.getNamespace(namespaces.userNamespace),
    };
  }

  async getNamespaces(): Promise<INamespaces> {
    if (this._namespaces) {
      return this._namespaces;
    }

    this._namespacesPromise = this._getNamespaces();
    this._namespaces = await this._namespacesPromise;
    return this._namespaces!;
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
    let signers: Signer[] = [];
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
        identifier
      );
      signers.push(certificateMintKeypair);
      await withInitNameEntryMint(
        transaction,
        this.provider.connection,
        this.provider.wallet,
        namespaceName,
        identifier,
        certificateMintKeypair
      );
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
    const caseInsensitiveMarker = (
      await ChatSdk.caseInsensitiveMarkerKey(
        namespaceId,
        identifier,
        this.programId
      )
    )[0];

    if (type === IdentifierType.Chat && !existingEntry?.isClaimed) {
      instructions.push(
        await this.program.instruction.approveChatIdentifierV0({
          accounts: {
            payer,
            caseInsensitiveMarker,
            namespaces: namespaces.publicKey,
            chatNamespace: namespaces.chatNamespace,
            claimRequest: claimRequestId,
            entry: entryId,
            certificateMintMetadata,
            namespacesProgram: NAMESPACES_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          },
        })
      );
    } else if (!existingEntry?.isClaimed) {
      instructions.push(
        await this.program.instruction.approveUserIdentifierV0({
          accounts: {
            payer,
            caseInsensitiveMarker,
            namespaces: namespaces.publicKey,
            userNamespace: namespaces.userNamespace,
            claimRequest: claimRequestId,
            entry: entryId,
            certificateMintMetadata,
            namespacesProgram: NAMESPACES_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
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
          publicKey: owner,
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

  async claimChatAdminInstructions({
    chat,
    admin = this.wallet.publicKey,
  }: ClaimChatAdminArgs): Promise<InstructionResult<null>> {
    const chatAcc = (await this.getChat(chat))!;
    if (chatAcc.identifierCertificateMint && !chatAcc.admin?.equals(admin)) {
      const identifierCertificateMintAccount =
        await Token.getAssociatedTokenAddress(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          chatAcc.identifierCertificateMint!,
          admin,
          true
        );

      return {
        output: null,
        signers: [],
        instructions: [
          await this.instruction.claimAdminV0({
            accounts: {
              chat,
              identifierCertificateMintAccount,
              ownerWallet: admin,
            },
          }),
        ],
      };
    }
    return {
      output: null,
      signers: [],
      instructions: [],
    };
  }

  async claimAdmin(
    args: ClaimChatAdminArgs,
    commitment: Finality = "confirmed"
  ): Promise<null> {
    return this.execute(
      this.claimChatAdminInstructions(args),
      args.admin,
      commitment
    );
  }

  async closeChatInstructions({
    refund = this.wallet.publicKey,
    chat,
    admin = this.wallet.publicKey,
  }: CloseChatArgs): Promise<InstructionResult<null>> {
    const instructions: TransactionInstruction[] = [];

    instructions.push(
      ...(
        await this.claimChatAdminInstructions({
          chat,
          admin,
        })
      ).instructions
    );

    const chatPermissionsKey = (await ChatSdk.chatPermissionsKey(chat))[0];
    const chatPermissions = await this.getChatPermissions(chatPermissionsKey);

    if (chatPermissions) {
      instructions.push(
        await this.instruction.closeChatPermissionsV0({
          accounts: {
            refund,
            admin,
            chat,
            chatPermissions: chatPermissionsKey,
            systemProgram: SystemProgram.programId,
          },
        })
      );
    }
    instructions.push(
      await this.instruction.closeChatV0({
        accounts: {
          refund,
          admin,
          chat,
          systemProgram: SystemProgram.programId,
        },
      })
    );
    return {
      signers: [],
      instructions,
      output: null,
    };
  }

  async closeChat(args: CloseChatArgs, commitment?: Finality): Promise<void> {
    await this.execute(
      this.closeChatInstructions(args),
      args.refund,
      commitment
    );
  }

  async initializeChatInstructions({
    payer = this.wallet.publicKey,
    identifierCertificateMint,
    identifier,
    name,
    permissions,
    postMessageProgramId = this.programId,
    imageUrl = "",
    metadataUrl = "",
    chatKeypair,
    admin = this.wallet.publicKey,
  }: InitializeChatArgs): Promise<
    BigInstructionResult<{
      chat: PublicKey;
      chatPermissions?: PublicKey;
      chatKeypair?: Keypair;
      identifierCertificateMint?: PublicKey;
    }>
  > {
    const instructions: TransactionInstruction[][] = [];
    const signers: Signer[][] = [];

    if (identifier) {
      const identifierInsts = await this.claimIdentifierInstructions({
        payer,
        owner: admin,
        identifier,
        type: IdentifierType.Chat,
      });
      identifierCertificateMint = identifierInsts.output.certificateMint;
      instructions.push(...identifierInsts.instructions);
      signers.push(...identifierInsts.signers);
    }

    const initChatInstructions: TransactionInstruction[] = [];
    const initChatSigners: Signer[] = [];
    let chat: PublicKey;
    if (identifierCertificateMint) {
      chat = (
        await ChatSdk.chatKey(identifierCertificateMint, this.programId)
      )[0];

      const namespaces = await this.getNamespaces();
      if (!identifier) {
        const metadataKey = await Metadata.getPDA(identifierCertificateMint);
        const metadata = await new Metadata(
          metadataKey,
          (await this.provider.connection.getAccountInfo(metadataKey))!
        );
        const [entryName] = metadata.data.data.name.split(".");
        identifier = entryName;
      }

      const [entry] = await await ChatSdk.entryKey(
        namespaces.chatNamespace,
        identifier
      );

      const identifierCertificateMintAccount =
        await Token.getAssociatedTokenAddress(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          identifierCertificateMint,
          admin,
          true
        );
      const instruction = await this.instruction.initializeChatV0(
        {
          name,
          imageUrl: imageUrl,
          metadataUrl: metadataUrl,
          postMessageProgramId,
        },
        {
          accounts: {
            payer,
            chat,
            namespaces: namespaces.publicKey,
            entry,
            identifierCertificateMint,
            identifierCertificateMintAccount,
            ownerWallet: admin,
            systemProgram: SystemProgram.programId,
          },
        }
      );
      initChatInstructions.push(instruction);
    } else {
      chatKeypair = chatKeypair || Keypair.generate();
      chat = chatKeypair.publicKey;
      const instruction = await this.instruction.initializeUnidentifiedChatV0(
        {
          name,
          imageUrl: imageUrl,
          metadataUrl: metadataUrl,
          postMessageProgramId,
        },
        admin,
        {
          accounts: {
            payer,
            chat,
            systemProgram: SystemProgram.programId,
          },
        }
      );
      initChatInstructions.push(instruction);
      initChatSigners.push(chatKeypair);
    }

    let chatPermissions: PublicKey | undefined = undefined;
    if (permissions) {
      let {
        readPermissionKey,
        postPermissionKey,
        postPermissionAction = PostAction.Hold,
        postPayDestination,
        postPermissionAmount = 1,
        defaultReadPermissionAmount = 1,
        readPermissionType = PermissionType.Token,
        postPermissionType = PermissionType.Token,
      } = permissions;
      if (readPermissionKey.equals(NATIVE_MINT)) {
        readPermissionType = PermissionType.Native;
      }

      if (postPermissionKey.equals(NATIVE_MINT)) {
        postPermissionType = PermissionType.Native;
      }

      // find the permission amounts
      let postAmount;
      try {
        const postMint = await getMintInfo(this.provider, postPermissionKey);
        postAmount = toBN(postPermissionAmount, postMint);
      } catch {
        // permission key isn't a mint account
        postAmount = new BN(postPermissionAmount);
      }

      let readAmount;
      try {
        const readMint = await getMintInfo(this.provider, readPermissionKey);
        readAmount = toBN(defaultReadPermissionAmount, readMint);
      } catch {
        // permission key isn't a mint account
        readAmount = new BN(defaultReadPermissionAmount);
      }

      chatPermissions = (
        await ChatSdk.chatPermissionsKey(chat, this.programId)
      )[0];
      initChatInstructions.push(
        await this.instruction.initializeChatPermissionsV0(
          {
            defaultReadPermissionAmount: readAmount as AnchorBN,
            postPermissionKey,
            readPermissionKey,
            postPermissionAction: postPermissionAction as never,
            postPermissionAmount: postAmount as AnchorBN,
            postPayDestination: postPayDestination || null,
            readPermissionType: readPermissionType as never,
            postPermissionType: postPermissionType as never,
          },
          {
            accounts: {
              payer,
              chat,
              chatPermissions: chatPermissions!,
              admin,
              systemProgram: SystemProgram.programId,
            },
          }
        )
      );
    }

    instructions.push(initChatInstructions);
    signers.push(initChatSigners);

    return {
      output: {
        chat,
        chatPermissions,
        chatKeypair,
        identifierCertificateMint,
      },
      signers,
      instructions,
    };
  }

  async initializeChat(
    args: InitializeChatArgs,
    commitment: Finality = "confirmed"
  ): Promise<{
    chat: PublicKey;
    chatPermissions?: PublicKey;
    identifierCertificateMint?: PublicKey;
  }> {
    return this.executeBig(
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
    const instructions: TransactionInstruction[] = [];

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

  async initializeSettingsInstructions({
    payer = this.wallet.publicKey,
    ownerWallet = this.wallet.publicKey,
    settings,
  }: InitializeSettingsArgs): Promise<
    InstructionResult<{
      settings: PublicKey;
    }>
  > {
    const instructions: TransactionInstruction[] = [];

    const settingsKey = (
      await ChatSdk.settingsKey(ownerWallet, this.programId)
    )[0];

    const symmKey = await generateSymmetricKey();
    const bufEncryptedSeed = await this.litJsSdk.encryptWithSymmetricKey(
      symmKey,
      this.litJsSdk.uint8arrayFromString(settings.delegateWalletSeed)
    );
    const encryptedDelegateWallet = buf2hex(
      await (bufEncryptedSeed as Blob).arrayBuffer()
    );
    await this.litAuth();
    const encryptedSymmetricKey = this.litJsSdk.uint8arrayToString(
      await this.litClient.saveEncryptionKey({
        solRpcConditions: [myWalletPermissions(ownerWallet)],
        symmetricKey: new Uint8Array(
          await crypto.subtle.exportKey("raw", symmKey)
        ),
        authSig: this.litAuthSig,
        chain: this.chain,
      }),
      "base16"
    );
    const encryptedSettings = {
      encryptedDelegateWallet,
      encryptedSymmetricKey,
    };

    instructions.push(
      await this.instruction.initializeSettingsV0(encryptedSettings, {
        accounts: {
          payer,
          settings: settingsKey,
          ownerWallet,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
        },
      })
    );

    return {
      output: {
        settings: settingsKey,
      },
      instructions,
      signers: [],
    };
  }

  async initializeSettings(
    args: InitializeSettingsArgs,
    commitment: Commitment = "confirmed"
  ): Promise<{
    settings: PublicKey;
  }> {
    return this.execute(
      this.initializeSettingsInstructions(args),
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
    const instructions: TransactionInstruction[] = [];
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
    sender = this.wallet.publicKey,
    chat,
    message: rawMessage,
    readPermissionAmount,
    delegateWallet,
    delegateWalletKeypair,
    encrypted = true,
    nftMint,
    readPermissionKey,
    readPermissionType,
  }: SendMessageArgs): Promise<BigInstructionResult<{ messageId: string }>> {
    const { referenceMessageId, type, ...message } = rawMessage;
    if (encrypted) {
      await this.litAuth();
    }
    let { fileAttachments, ...normalMessage } = message;
    const chatPermissions = (
      await ChatSdk.chatPermissionsKey(chat, this.programId)
    )[0];
    const chatPermissionsAcc = (await this.getChatPermissions(
      chatPermissions
    ))!;

    let readAmount;
    try {
      const readMint = await getMintInfo(
        this.provider,
        chatPermissionsAcc.readPermissionKey
      );
      readAmount = toBN(
        readPermissionAmount || chatPermissionsAcc.defaultReadPermissionAmount,
        readMint
      );
    } catch {
      readAmount = new BN(
        readPermissionAmount || chatPermissionsAcc.defaultReadPermissionAmount
      );
    }
    const accessControlConditionsToUse = getAccessConditions(
      this.conditionVersion,
      chatPermissionsAcc.readPermissionKey,
      readAmount,
      this.chain,
      chatPermissionsAcc!.readPermissionType
    );

    const storedSymKey = this.symKeyStorage.getSymKeyToUse(
      chatPermissionsAcc.readPermissionKey,
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
          const encrypted = await this.litJsSdk.encryptWithSymmetricKey(
            symmKey,
            await fileAttachment.file.arrayBuffer()
          );
          return {
            file: new File(
              [encrypted],
              fileAttachment.file.name + ".encrypted"
            ),
            name: fileAttachment.name,
          };
        })
      );
    }

    // Attach files to either attachments or encryptedAttachments based on whether they were encrypted
    if (fileAttachments) {
      let attachments: { name: string; file: string }[];
      if (encrypted) {
        normalMessage.encryptedAttachments =
          normalMessage.encryptedAttachments || [];
        attachments = normalMessage.encryptedAttachments;
      } else {
        normalMessage.attachments = normalMessage.attachments || [];
        attachments = normalMessage.attachments;
      }

      const uploaded = (
        (await uploadFiles(
          this.provider,
          fileAttachments.map((f) => f.file),
          delegateWalletKeypair
        )) || []
      ).filter(truthy);
      if (uploaded.length != fileAttachments.length) {
        throw new Error("Failed to upload all files");
      }
      attachments.push(
        ...uploaded.map((uploaded, i) => ({
          file: uploaded,
          name: fileAttachments![i].name,
        }))
      );
    }

    // Encrypt the actual json structure
    let encryptedSymmetricKey, encryptedString;
    if (encrypted) {
      const encryptedStringOut = await this.litJsSdk.encryptWithSymmetricKey(
        symmKey,
        this.litJsSdk.uint8arrayFromString(JSON.stringify(normalMessage))
      );
      encryptedString = buf2hex(
        await (encryptedStringOut as Blob).arrayBuffer()
      );
      if (storedSymKey) {
        encryptedSymmetricKey = storedSymKey.encryptedSymKey;
      } else {
        // Cache the sym key we're using
        encryptedSymmetricKey = this.litJsSdk.uint8arrayToString(
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
          chatPermissionsAcc.readPermissionKey,
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

    const postPermissionAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      nftMint ? nftMint : chatPermissionsAcc.postPermissionKey,
      sender,
      true
    );

    const remainingAccounts: any[] = [];
    if (nftMint) {
      remainingAccounts.push({
        pubkey: await Metadata.getPDA(nftMint),
        isWritable: false,
        isSigner: false,
      });
    }
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

    const contentLength = encryptedString.length;
    const numGroups = Math.ceil(contentLength / MESSAGE_MAX_CHARACTERS);
    const instructionGroups: TransactionInstruction[][] = [];
    const signerGroups: Signer[][] = [];
    const messageId = uuid();
    const ix = chatPermissionsAcc?.postPermissionKey.equals(NATIVE_MINT)
      ? this.instruction.sendNativeMessageV0
      : this.instruction.sendTokenMessageV0;
    for (let i = 0; i < numGroups; i++) {
      const instructions: TransactionInstruction[] = [];
      instructions.push(
        await ix(
          {
            conditionVersion: this.conditionVersion,
            id: messageId,
            content: encryptedString.slice(
              i * MESSAGE_MAX_CHARACTERS,
              (i + 1) * MESSAGE_MAX_CHARACTERS
            ),
            encryptedSymmetricKey,
            readPermissionAmount: readAmount,
            readPermissionType: (readPermissionType ||
              chatPermissionsAcc.readPermissionType) as never,
            readPermissionKey:
              readPermissionKey || chatPermissionsAcc.readPermissionKey,
            totalParts: numGroups,
            currentPart: i,
            messageType: (RawMessageType as any)[
              capitalizeFirstLetter(type)
            ] as never,
            referenceMessageId: referenceMessageId || null,
          },
          {
            accounts: {
              chat,
              chatPermissions,
              sender,
              signer: delegateWallet || sender,
              // @ts-ignore
              postPermissionAccount,
              postPermissionMint: nftMint
                ? nftMint
                : chatPermissionsAcc.postPermissionKey,
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

  async createMetadataForBondingInstructions({
    metadataUpdateAuthority = this.provider.wallet.publicKey,
    metadata,
    targetMintKeypair = Keypair.generate(),
    decimals,
  }: ICreateMetadataForBondingArgs): Promise<
    InstructionResult<{ metadata: PublicKey; mint: PublicKey }>
  > {
    const targetMint = targetMintKeypair.publicKey;
    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];

    instructions.push(
      ...(await createMintInstructions(
        this.tokenBondingProgram.provider,
        this.provider.wallet.publicKey,
        targetMint,
        decimals
      ))
    );
    signers.push(targetMintKeypair);
    const {
      instructions: metadataInstructions,
      signers: metadataSigners,
      output,
    } = await this.tokenMetadataProgram.createMetadataInstructions({
      data: metadata,
      mint: targetMint,
      mintAuthority: this.provider.wallet.publicKey,
      authority: metadataUpdateAuthority,
    });
    instructions.push(...metadataInstructions);
    signers.push(...metadataSigners);

    instructions.push(
      Token.createSetAuthorityInstruction(
        TOKEN_PROGRAM_ID,
        targetMint,
        (await SplTokenBonding.tokenBondingKey(targetMint))[0],
        "MintTokens",
        this.provider.wallet.publicKey,
        []
      )
    );

    return {
      instructions,
      signers,
      output: {
        ...output,
        mint: targetMint,
      },
    };
  }
}

function getAccessConditions(
  conditionVersion: number,
  readKey: PublicKey,
  threshold: BN,
  chain: string,
  permissionType: PermissionType
) {
  if (conditionVersion === 0) {
    return [tokenAccessPermissions(readKey, threshold, chain)];
  }

  if (conditionVersion === 1) {
    return [
      collectionAccessPermissions(readKey, threshold, chain),
      { operator: "or" },
      tokenAccessPermissions(readKey, threshold, chain),
    ];
  }

  const permissionTypeStr = Object.keys(permissionType)[0];
  if (permissionTypeStr === "token") {
    return [tokenAccessPermissions(readKey, threshold, chain)];
  } else if (permissionTypeStr == "native") {
    return [nativePermissions(readKey, threshold, chain)];
  }
  return [collectionAccessPermissions(readKey, threshold, chain)];
}

function collectionAccessPermissions(
  permittedCollection: PublicKey,
  threshold: BN,
  chain: string
) {
  return {
    method: "balanceOfMetaplexCollection",
    params: [permittedCollection.toBase58()],
    chain,
    returnValueTest: {
      key: "",
      comparator: ">=",
      value: threshold.toString(10),
    },
  };
}

function tokenAccessPermissions(
  readPermissionMint: PublicKey,
  threshold: BN,
  chain: string
) {
  return {
    method: "balanceOfToken",
    params: [readPermissionMint.toBase58()],
    chain,
    returnValueTest: {
      key: `$.amount`,
      comparator: ">=",
      value: threshold.toString(10),
    },
  };
}

function myWalletPermissions(wallet: PublicKey) {
  return {
    method: "",
    params: [":userAddress"],
    chain: "solana",
    returnValueTest: {
      key: "",
      comparator: "=",
      value: wallet.toBase58(),
    },
  };
}

function nativePermissions(wallet: PublicKey, threshold: BN, chain: string) {
  return {
    method: "getBalance",
    params: [wallet.toBase58()],
    chain,
    returnValueTest: {
      key: "",
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
    return new PublicKey(arg0);
  }
  return arg0;
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
