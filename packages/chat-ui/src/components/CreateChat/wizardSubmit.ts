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

interface IWazardSubmitOpts {
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

export const wizardSubmit = async ({
  sdks,
  data: { wizardData },
  delegateWallet,
  setState,
}: IWazardSubmitOpts) => {
  const { chatSdk, tokenBondingSdk } = sdks;
  let innerError: null | Error = null;
  const { name, identifier, imageUrl } = wizardData;
  const { readForm, postForm, postIsSameAsRead } = wizardData;

  if (chatSdk && tokenBondingSdk) {
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
      readForm.type === "native"
        ? new PublicKey(readForm.mint!)
        : readForm.type === "nft"
        ? new PublicKey(readForm.collectionKey!)
        : undefined;

    postPermissionType = getPermissionType(postForm.type);
    postPermissionAmount = postForm.amount;
    postPermissionKey =
      postForm.type === "native"
        ? new PublicKey(postForm.mint!)
        : postForm.type === "nft"
        ? new PublicKey(postForm.collectionKey!)
        : undefined;

    if (!readPermissionKey || !postPermissionKey) {
      if (!readPermissionKey) {
        readPermissionAmount = toBN(
          readForm.amount!,
          defaultBondingOpts.targetMintDecimals
        );
        const targetMintKeypair = Keypair.generate();
        const file = getJsonFile({
          name,
          symbol: identifier,
          description: postIsSameAsRead
            ? `Permission token for ${identifier} chat`
            : `Read permission token for ${identifier} chat`,
          image: imageUrl,
          mint: targetMintKeypair.publicKey,
        });
        randomizeFileName(file);

        try {
          setState({
            subStatus: "Uploading read token metadata to SHDW drive...",
          });

          const uri = await uploadFiles(
            chatSdk!.provider,
            [file],
            delegateWallet
          );

          if (!uri || !uri.length)
            throw new Error("Failed to upload token metadata");

          const metadata = getMetadataOpts({
            identifier: `${postIsSameAsRead ? "" : "READ"}${identifier}`,
            uri: uri[0],
          });

          const curveOut = await tokenBondingSdk.initializeCurveInstructions({
            config: getCurveConfig(
              (readForm as ITokenFormValues).startingPrice!
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

          readPermissionInstructions.push(
            [...curveOut!.instructions!, ...metaOut!.instructions],
            bondingOut!.instructions
          );

          readPermissionSigners.push(
            [...curveOut!.signers, ...metaOut!.signers],
            bondingOut!.signers
          );

          readPermissionKey = targetMintKeypair.publicKey;
        } catch (e) {
          innerError = e as Error;
          setState({
            error: e as Error,
          });
        }
      }

      if (!postPermissionKey && !innerError) {
        if (postIsSameAsRead) {
          postPermissionKey = readPermissionKey;
        } else {
          postPermissionAmount = toBN(
            readForm.amount!,
            defaultBondingOpts.targetMintDecimals
          );
          const targetMintKeypair = Keypair.generate();
          const file = getJsonFile({
            name,
            symbol: identifier,
            description: `Post permission token for ${identifier} chat`,
            image: imageUrl,
            mint: targetMintKeypair.publicKey,
          });
          randomizeFileName(file);

          try {
            setState({
              subStatus: "Uploading post token metadata to SHDW drive...",
            });

            const uri = await uploadFiles(
              chatSdk!.provider,
              [file],
              delegateWallet
            );

            if (!uri || !uri.length)
              throw new Error("Failed to upload token metadata");

            const metadata = getMetadataOpts({
              identifier: `POST${identifier}`,
              uri: uri[0],
            });

            const curveOut = await tokenBondingSdk.initializeCurveInstructions({
              config: getCurveConfig(
                (readForm as ITokenFormValues).startingPrice!
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

            postPermissionInstructions.push(
              [...curveOut!.instructions!, ...metaOut!.instructions],
              bondingOut!.instructions
            );

            postPermissionSigners.push(
              [...curveOut!.signers, ...metaOut!.signers],
              bondingOut!.signers
            );

            postPermissionKey = targetMintKeypair.publicKey;
          } catch (e) {
            innerError = e as Error;
            setState({
              error: e as Error,
            });
          }
        }
      }
    }

    if (!innerError) {
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
    } else {
      setState({ status: undefined, subStatus: undefined });
    }
  }
};
