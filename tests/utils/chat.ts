import { AnchorProvider } from "@project-serum/anchor";
import {
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey
} from "@solana/web3.js";
import {
  ChatSdk,
  IdentifierType,
} from "@strata-foundation/chat";
import {
  sendMultipleInstructions
} from "@strata-foundation/spl-utils";
import nacl from "tweetnacl";
import {
  fromString as uint8arrayFromString,
  toString as uint8arrayToString,
} from "uint8arrays";

export async function initializeUser(
  provider: AnchorProvider, 
  chatSdk: ChatSdk, 
  username: string, 
  profileKeypair: Keypair, 
  delegateWalletKeypair?: Keypair
): Promise<{walletProfile: PublicKey}> {
  
  const {
    instructions: claimInstructions,
    signers: claimSigners,
    output: { certificateMint: userIdentifierCertificateMint },
  } = await chatSdk.claimIdentifierInstructions({
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

  let finalInstructions = [...claimInstructions, instructions];
  let finalSigners = [[], [...claimSigners[0]],
    [...claimSigners[1], profileKeypair],
    [...signers, profileKeypair],]

  if (delegateWalletKeypair) {
    const { instructions: dInstructions, signers: dSigners } =
      await chatSdk.initializeDelegateWalletInstructions({
        delegateWalletKeypair,
      });
    finalInstructions = [...finalInstructions, dInstructions];
    finalSigners = [...finalSigners, dSigners];
  }
  try {
    await sendMultipleInstructions(
      new Map(),
      provider,
      [
        [
          SystemProgram.transfer({
            fromPubkey: provider.wallet.publicKey,
            toPubkey: profileKeypair.publicKey,
            lamports: 0.01 * LAMPORTS_PER_SOL,
          }),
        ],
        ...finalInstructions
      ],
      finalSigners,
      provider.wallet.publicKey
    );
  } catch (e: any) {
    console.error(e);
    throw e;
  }
  return {
    walletProfile: outWalletProfile,
  }
}

export async function initializeChat(
  chatSdk: ChatSdk, identifier: string, name: string, readPermissionKey: PublicKey, postPermissionKey: PublicKey
) {
  const { certificateMint: chatIdentifierCertificateMint } =
    await chatSdk.claimIdentifier({
      identifier,
      type: IdentifierType.Chat,
    });
  const { chat } = await chatSdk.initializeChat({
    identifierCertificateMint: chatIdentifierCertificateMint,
    name,
    readPermissionKey,
    postPermissionKey,
  });
  return chat;
}

export const AUTH_SIGNATURE_BODY =
  "I am creating an account to use Lit Protocol at {{timestamp}}";

export async function getAuthSig(publicKey: PublicKey, secretKey: Uint8Array) {
  const now = new Date().toISOString();
  const body = AUTH_SIGNATURE_BODY.replace("{{timestamp}}", now);

  const data = new TextEncoder().encode(body);
  const signed = nacl.sign.detached(data, secretKey);
  // const signed = await provider.signMessage(data, "utf8");

  const hexSig = uint8arrayToString(signed, "base16");

  const authSig = {
    sig: hexSig,
    derivedVia: "solana.signMessage",
    signedMessage: body,
    address: publicKey.toBase58(),
  };

  return authSig;
}