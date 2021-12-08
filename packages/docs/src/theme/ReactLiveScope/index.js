import React from 'react';
import { useStrataSdks } from '@strata-foundation/react';
import { BN } from "bn.js";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import { getAssociatedAccountBalance } from "@strata-foundation/spl-utils";
import { ExponentialCurveConfig, TimeCurveConfig } from "@strata-foundation/spl-token-bonding";
import { sendAndConfirmRawTransaction, Keypair, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, AccountLayout, NATIVE_MINT } from "@solana/spl-token";
import { Data, sendMultipleInstructions } from "@strata-foundation/spl-utils";
import { Numberu32, Numberu64, createInstruction, createNameRegistry, getHashedName, getNameAccountKey, NameRegistryState, NAME_PROGRAM_ID } from "@solana/spl-name-service";
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useTokenMetadata, useTokenRef, useTokenBonding, useBondingPricing } from "@strata-foundation/react";
import { useVariablesContext, useVariables } from "../Root/variables";
import { getMintInfo, getTokenAccount } from "@project-serum/common";

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

// Add react-live imports you need here
const ReactLiveScope = {
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
