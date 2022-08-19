import { DataV2 } from "@metaplex-foundation/mpl-token-metadata";
import { NATIVE_MINT } from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  Signer,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  ChatSdk,
  PermissionType,
  randomizeFileName,
  uploadFiles,
} from "@strata-foundation/chat";
import {
  SplTokenBonding,
  TimeCurveConfig,
  TimeDecayExponentialCurveConfig,
} from "@strata-foundation/spl-token-bonding";
import { sendMultipleInstructions, toBN } from "@strata-foundation/spl-utils";
import { ICreateChatModalState } from "./CreateChatModal";
import { ITokenFormValues } from "./TokenForm";

interface IWizardSubmitOpts {
  sdks: {
    tokenBondingSdk: SplTokenBonding | undefined;
    chatSdk: ChatSdk | undefined;
  };
  data: ICreateChatModalState;
  delegateWallet: Keypair | undefined;
  setState: (value: Partial<ICreateChatModalState>) => void;
}

const defaultBondingOpts = {
  baseMint: NATIVE_MINT,
  buyBaseRoyaltyPercentage: 0,
  buyTargetRoyaltyPercentage: 5,
  sellBaseRoyaltyPercentage: 0,
  sellTargetRoyaltyPercentage: 0,
  targetMintDecimals: 9,
};

const getCurveConfig = (startingPrice: number) => {
  const k = 1;
  const c = startingPrice * (k + 1);

  return new TimeCurveConfig()
    .addCurve(
      0,
      new TimeDecayExponentialCurveConfig({
        c,
        k0: 0,
        k1: 0,
        d: 1,
        interval: 0,
      })
    )
    .addCurve(
      30 * 60, // 30 minutes
      new TimeDecayExponentialCurveConfig({
        c,
        k0: 0,
        k1: k,
        d: 0.5,
        interval: 1.5 * 60 * 60, // 1.5 hours
      })
    );
};

const getPermissionType = (typeString: string | undefined) => {
  if (!typeString) return undefined;

  return {
    native: PermissionType.Native,
    token: PermissionType.Token,
    nft: PermissionType.NFT,
  }[typeString];
};

const getMetadataOpts = ({
  identifier,
  uri,
}: {
  identifier: string;
  uri: string;
}) =>
  new DataV2({
    name: identifier.substring(0, 32),
    symbol: identifier.substring(0, 10),
    uri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  });

const getJsonFile = (arg0: {}) =>
  new File(
    [new Blob([JSON.stringify(arg0)], { type: "application/json" })],
    "file.json"
  );

async function createPermissionToken({
  sdks: { chatSdk, tokenBondingSdk },
  data: { wizardData: { name, identifier, postIsSameAsRead, imageUrl, readForm, postForm } },
  delegateWallet,
  setState,
  isRead,
}: IWizardSubmitOpts & {
  isRead: boolean;
}) {
  const targetMintKeypair = Keypair.generate();
  const file = getJsonFile({
    name,
    symbol: identifier,
    description: postIsSameAsRead
      ? `Permission token for ${identifier} chat`
      : isRead ? `Read permission token for ${identifier} chat`
      : `Post permission token for ${identifier} chat`,
    image: imageUrl,
    mint: targetMintKeypair.publicKey,
  });
  const tokenForm = isRead ? readForm : postForm;
  randomizeFileName(file);

  let tokenPermissionKey, innerError;
  let tokenPermissionInstructions: TransactionInstruction[][] = [];
  let tokenPermissionSigners: Signer[][] = [];
  try {
    setState({
      subStatus: `Uploading ${isRead ? 'read' : 'post'} token metadata to SHDW drive...`,
    });

    const uri = await uploadFiles(
      chatSdk!.provider,
      [file],
      delegateWallet
    );

    if (!uri || !uri.length)
      throw new Error("Failed to upload token metadata");

    const metadata = getMetadataOpts({
      identifier: `${postIsSameAsRead ? "" : isRead ? "READ": "POST"}${identifier}`,
      uri: uri[0],
    });

    const curveOut = await tokenBondingSdk.initializeCurveInstructions({
      config: getCurveConfig(
        (tokenForm as ITokenFormValues).startingPrice!
      ),
    });

    const bondingOpts = {
      ...defaultBondingOpts,
      targetMint: targetMintKeypair.publicKey,
      curve: curveOut!.output.curve,
    };

    const metaOut = await chatSdk.createMetadataForBondingInstructions({
      targetMintKeypair,
      metadataUpdateAuthority: chatSdk.wallet.publicKey,
      metadata,
      decimals: bondingOpts.targetMintDecimals,
    });

    const bondingOut =
      await tokenBondingSdk.createTokenBondingInstructions(bondingOpts);

    tokenPermissionKey = bondingOut.output.targetMint;
    tokenPermissionInstructions.push(
      [...curveOut!.instructions!, ...metaOut!.instructions],
      bondingOut!.instructions
    );

    tokenPermissionSigners.push(
      [...curveOut!.signers, ...metaOut!.signers],
      bondingOut!.signers
    );

    tokenPermissionKey = targetMintKeypair.publicKey;
  } catch (e) {
    innerError = e as Error;
    setState({
      error: e as Error,
    });
  }

  return {
    tokenPermissionKey,
    tokenPermissionInstructions,
    tokenPermissionSigners,
    innerError,
  }
}

export const wizardSubmit = async ({
  sdks,
  data,
  delegateWallet,
  setState,
}: IWizardSubmitOpts) => {
  const { wizardData } = data;
  const { chatSdk, tokenBondingSdk } = sdks;
  let innerError: null | Error = null;
  const { name, identifier, imageUrl } = wizardData;
  const { readForm, postForm, postIsSameAsRead } = wizardData;

  if (!chatSdk && !tokenBondingSdk) return

  setState({ status: "submitting", error: undefined });
  let readPermissionType, readPermissionAmount, readPermissionKey;
  let postPermissionType, postPermissionAmount, postPermissionKey;
  let readPermissionInstructions: TransactionInstruction[][] = [],
    readPermissionSigners: Signer[][] = [],
    postPermissionInstructions: TransactionInstruction[][] = [],
    postPermissionSigners: Signer[][] = [];

  readPermissionType = getPermissionType(readForm.type);
  readPermissionAmount = readForm.amount;
  readPermissionKey =
    readForm.type === "native" || readForm.type === "token"
      ? readForm.mint
        ? new PublicKey(readForm.mint)
        : undefined
      : readForm.type === "nft"
      ? new PublicKey(readForm.collectionKey!)
      : undefined;

  postPermissionType = getPermissionType(postForm.type);
  postPermissionAmount = postForm.amount;
  postPermissionKey =
    postForm.type === "native" || postForm.type === "token"
      ? postForm.mint
        ? new PublicKey(postForm.mint)
        : undefined
      : postForm.type === "nft"
      ? new PublicKey(postForm.collectionKey!)
      : undefined;

  let chatMetadataUri = "";
  // Upload chat metadata json
  if (wizardData.description && wizardData.description != "") {
    try {
      setState({
        subStatus: "Uploading chat metadata to SHDW drive...",
      });

      const file = getJsonFile({
        description: wizardData.description
      });
      randomizeFileName(file);

      chatMetadataUri = (await uploadFiles(
        chatSdk!.provider,
        [file],
        delegateWallet
      ))[0];
    } catch(err) {
      innerError = err as Error;
      setState({
        error: err as Error,
      });
    }
  }

  // Create read token if needed
  if (!readPermissionKey && !innerError) {
    readPermissionAmount = toBN(
      readForm.amount!,
      defaultBondingOpts.targetMintDecimals
    );
    
    const readToken = await createPermissionToken({sdks, data, delegateWallet, setState, isRead: true});
    readPermissionKey = readToken.tokenPermissionKey;
    readPermissionInstructions = readToken.tokenPermissionInstructions;
    readPermissionSigners = readToken.tokenPermissionSigners;
    innerError = readToken.innerError;
  }

  // Create post token if needed
  const needsPostPermissionToken = !postPermissionKey && !innerError;
  if (needsPostPermissionToken && !postIsSameAsRead) {
    postPermissionAmount = toBN(
      readForm.amount!,
      defaultBondingOpts.targetMintDecimals
    );

    const postToken = await createPermissionToken({sdks, data, delegateWallet, setState, isRead: false});
    postPermissionKey = postToken.tokenPermissionKey;
    postPermissionInstructions = postToken.tokenPermissionInstructions;
    postPermissionSigners = postToken.tokenPermissionSigners;
    innerError = postToken.innerError;

  } else if (needsPostPermissionToken && postIsSameAsRead) {
    postPermissionKey = readPermissionKey;
    postPermissionAmount = readPermissionAmount;
    postPermissionType = readPermissionType;
  }
  if (innerError) {
    setState({ status: undefined, subStatus: undefined });
    return;
  }
  const chatOut = await chatSdk.initializeChatInstructions({
    name,
    identifier,
    imageUrl,
    permissions: {
      readPermissionKey: readPermissionKey!,
      defaultReadPermissionAmount: readPermissionAmount,
      readPermissionType,
      postPermissionKey: postPermissionKey!,
      postPermissionAmount,
      postPermissionType,
    },
    metadataUrl: chatMetadataUri,
  });

  setState({
    subStatus: `Creating ${identifier} chat...`,
  });

  try {
    await sendMultipleInstructions(
      chatSdk.errors || tokenBondingSdk.errors || new Map(),
      chatSdk.provider,
      [
        ...readPermissionInstructions,
        ...postPermissionInstructions,
        ...chatOut.instructions,
      ],
      [
        ...readPermissionSigners,
        ...postPermissionSigners,
        ...chatOut.signers,
      ]
    );

    setState({ status: "success", subStatus: undefined });
  } catch (e) {
    setState({
      status: undefined,
      subStatus: undefined,
      error: e as Error,
    });
  }

};
