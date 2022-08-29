import { NATIVE_MINT } from "@solana/spl-token";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { ITokenWithMetaAndAccount } from "@strata-foundation/spl-token-collective";
import { toNumber } from "@strata-foundation/spl-utils";
import React from "react";

interface ICloseOutWumboSubmitOpts {
  tokenBondingSdk: SplTokenBonding | undefined;
  tokens: ITokenWithMetaAndAccount[];
  expectedOutputAmountByToken: { [key: string]: number };
  setStatus: React.Dispatch<React.SetStateAction<string>>;
}

export const closeOutWumboSubmit = async ({
  tokenBondingSdk,
  tokens,
  expectedOutputAmountByToken,
  setStatus,
}: ICloseOutWumboSubmitOpts) => {
  let processedTokenCount = 0;
  let innerError: null | Error = null;

  if (!tokenBondingSdk) return;

  setStatus("Recouping SOL");
  for (let token of tokens) {
    const { publicKey: tokenBondingKey, targetMint } = token.tokenBonding;

    setStatus(`Swapping: ${token.metadata?.data?.name}`);

    try {
      await tokenBondingSdk.swap({
        baseMint: targetMint,
        targetMint: NATIVE_MINT,
        baseAmount: toNumber(token.account.amount, token.mint),
        expectedOutputAmount:
          expectedOutputAmountByToken[token.publicKey.toBase58()],
        slippage: 0.05,
      });

      processedTokenCount += 0;
    } catch (err) {
      // do nothing with error
      console.log(err);
    }
  }

  if (processedTokenCount == tokens.length) {
    setStatus("successful");
  } else {
    setStatus("orphaned");
  }
};
