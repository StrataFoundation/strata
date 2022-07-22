import { DataV2 } from "@metaplex-foundation/mpl-token-metadata";
import { NATIVE_MINT } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { ChatSdk, PermissionType } from "@strata-foundation/chat";
import {
  SplTokenBonding,
  TimeCurveConfig,
  TimeDecayExponentialCurveConfig,
} from "@strata-foundation/spl-token-bonding";
import { SplTokenMetadata } from "@strata-foundation/spl-utils";
import { ICreateChatModalState } from "./CreateChatModal";
import { ITokenFormValues } from "./TokenForm";

interface IWazardSubmitOpts {
  sdks: {
    tokenBondingSdk: SplTokenBonding | undefined;
    tokenMetadataSdk: SplTokenMetadata | undefined;
    chatSdk: ChatSdk | undefined;
  };
  data: ICreateChatModalState;
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

export const wizardSubmit = async ({
  sdks,
  data: { wizardData },
  setState,
}: IWazardSubmitOpts) => {
  setState({ status: "submitting" });
  const { chatSdk, tokenBondingSdk, tokenMetadataSdk } = sdks;
  const { name, identifier, image, imageUrl } = wizardData;
  const { readForm, postForm, postIsSameAsRead } = wizardData;
  let readPermissionType, readPermissionAmount, readPermissionKey;
  let postPermissionType, postPermissionAmount, postPermissionKey;
  let readTokenOut, postTokenOut;

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
      const targetMintKeypair = Keypair.generate();
      const curveOut = await tokenBondingSdk?.initializeCurveInstructions({
        config: getCurveConfig((readForm as ITokenFormValues).startingPrice!),
      });

      const bondingOpts = {
        ...defaultBondingOpts,
        targetMint: targetMintKeypair.publicKey,
      };

      // need to get uri
      // const metadata = getMetadataOpts({
      //   identifier: `${postIsSameAsRead ? "" : "READ"}${identifier}`,
      //   uri,
      // });

      readPermissionKey = targetMintKeypair.publicKey;
      console.log(`Creating read permission ${identifier}Read token...`);
    }

    if (!postPermissionKey) {
      if (postIsSameAsRead) {
        postPermissionKey = readPermissionKey;
      } else {
        const targetMintKeypair = Keypair.generate();
        const curveOut = await tokenBondingSdk?.initializeCurveInstructions({
          config: getCurveConfig((postForm as ITokenFormValues).startingPrice!),
        });

        const bondingOpts = {
          ...defaultBondingOpts,
          targetMint: targetMintKeypair.publicKey,
        };

        // const metadata = getMetadataOpts({
        //   identifier: `POST${identifier}`,
        //   uri,
        // });

        readPermissionKey = targetMintKeypair.publicKey;
        console.log(`Creating read permission ${identifier}Read token...`);
      }
    }
  }

  console.log("Initialize Chat");
  const chatOut = await chatSdk?.initializeChatInstructions({
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
  console.log(wizardData);
};
