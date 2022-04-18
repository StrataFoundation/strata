import BrowserOnly from "@docusaurus/BrowserOnly";
import {
  createInstruction,
  createNameRegistry,
  getHashedName,
  getNameAccountKey,
  NameRegistryState,
  NAME_PROGRAM_ID,
  Numberu32,
  Numberu64,
} from "@solana/spl-name-service";
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
  MintLayout,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  sendAndConfirmRawTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  useBondingPricing,
  useStrataSdks,
  useTokenBonding,
  useTokenMetadata,
  useTokenRef,
} from "@strata-foundation/react";
import {
  TimeDecayExponentialCurveConfig,
  ExponentialCurveConfig,
  SplTokenBonding,
  TimeCurveConfig,
} from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import {
  createMetadata,
  Data,
  getAssociatedAccountBalance,
  getMintInfo,
  getTokenAccount,
  sendMultipleInstructions,
  createMintInstructions,
} from "@strata-foundation/spl-utils";
import { BN } from "bn.js";
import React from "react";
import { useVariables, useVariablesContext } from "../Root/variables";
import { MarketplaceSdk } from "@strata-foundation/marketplace-sdk";
import { DataV2, Metadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  BountyDetail,
  BountyCard,
  useBounties,
} from "@strata-foundation/marketplace-ui";

function BrowserOnlyAsyncButton(props) {
  return (
    <BrowserOnly fallback={<div>...</div>}>
      {() => {
        const Component = require("./AsyncButton").default;
        return <Component {...props} />;
      }}
    </BrowserOnly>
  );
}

function Swap(props) {
  return (
    <BrowserOnly fallback={<div>...</div>}>
      {() => {
        const Component = require("@strata-foundation/react").Swap;
        return <Component {...props} />;
      }}
    </BrowserOnly>
  );
}

function ManyToOneSwap(props) {
    return (
      <BrowserOnly fallback={<div>...</div>}>
        {() => {
          const Component = require("@strata-foundation/react").ManyToOneSwap;
          return <Component {...props} />;
        }}
      </BrowserOnly>
    );
}



// Add react-live imports you need here
const ReactLiveScope = {
  MintLayout,
  createMintInstructions,
  ManyToOneSwap,
  Metadata,
  BountyCard,
  BountyDetail,
  useBounties,
  DataV2,
  MarketplaceSdk,
  u64,
  TOKEN_PROGRAM_ID,
  TimeDecayExponentialCurveConfig,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  createMetadata,
  Data,
  NATIVE_MINT,
  getMintInfo,
  getTokenAccount,
  Numberu32,
  sendAndConfirmRawTransaction,
  Numberu64,
  NAME_PROGRAM_ID,
  createInstruction,
  SystemProgram,
  Data,
  useBondingPricing,
  useTokenRef,
  useTokenBonding,
  useVariablesContext,
  useVariables,
  useTokenMetadata,
  useStrataSdks,
  sendMultipleInstructions,
  createNameRegistry,
  getHashedName,
  getNameAccountKey,
  NameRegistryState,
  React,
  AccountLayout,
  TOKEN_PROGRAM_ID,
  Swap,
  AsyncButton: BrowserOnlyAsyncButton,
  BN,
  SplTokenBonding,
  Keypair,
  PublicKey,
  Transaction,
  SplTokenCollective,
  getAssociatedAccountBalance,
  ExponentialCurveConfig,
  TimeCurveConfig,
  ...React,
};

export default ReactLiveScope;
