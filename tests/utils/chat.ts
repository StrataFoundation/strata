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
  PermissionType,
} from "@strata-foundation/chat";
import {
  sendMultipleInstructions
} from "@strata-foundation/spl-utils";

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
        ownerWallet: profileKeypair.publicKey
      });
    finalInstructions = [...finalInstructions, dInstructions];
    finalSigners = [...finalSigners, [...dSigners, profileKeypair]];
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
  chatSdk: ChatSdk, identifier: string, name: string, readPermissionKey: PublicKey, postPermissionKey: PublicKey, readPermissionType: PermissionType, postPermissionType: PermissionType
) {
  const { chat } = await chatSdk.initializeChat({
    identifier,
    name,
    permissions: {
      readPermissionKey,
      postPermissionKey,
      readPermissionType,
      postPermissionType,
    },
  });
  return chat;
}

