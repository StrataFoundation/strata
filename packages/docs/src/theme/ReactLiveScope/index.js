import React from 'react';
import { useStrataSdks } from '@strata-foundation/react';
import { BN } from "bn.js";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import { getAssociatedAccountBalance } from "@strata-foundation/spl-utils";
import { ExponentialCurveConfig, TimeCurveConfig } from "@strata-foundation/spl-token-bonding";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, AccountLayout } from "@solana/spl-token";
import { sendMultipleInstructions } from "@strata-foundation/spl-utils";
import { createNameRegistry, getHashedName, getNameAccountKey, NameRegistryState } from "@bonfida/spl-name-service";
import BrowserOnly from '@docusaurus/BrowserOnly';

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

// Add react-live imports you need here
const ReactLiveScope = {
  useStrataSdks,
  sendMultipleInstructions,
  createNameRegistry,
  getHashedName,
  getNameAccountKey,
  NameRegistryState,
  React,
  AccountLayout,
  TOKEN_PROGRAM_ID,
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
