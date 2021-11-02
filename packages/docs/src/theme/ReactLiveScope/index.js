/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { usePrograms } from '../../hooks/programs';
import { BN } from "bn.js";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import { getAssociatedAccountBalance } from "@strata-foundation/spl-utils";
import { ExponentialCurveConfig, TimeCurveConfig } from "@strata-foundation/spl-token-bonding";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, AccountLayout } from "@solana/spl-token";
import { sendMultipleInstructions } from "@strata-foundation/spl-utils";
import { createNameRegistry, getHashedName, getNameAccountKey, NameRegistryState } from "@bonfida/spl-name-service";


function createBrowserOnlyLibComponent(path, componentExportName) {
  function LibComponentBrowserOnly(props) {
    return (
      <BrowserOnly fallback={<div>...</div>}>
        {() => {
          const Component = require(path)[componentExportName];
          return <Component {...props} />;
        }}
      </BrowserOnly>
    );
  }
};

// Add react-live imports you need here
const ReactLiveScope = {
  sendMultipleInstructions,
  createNameRegistry,
  getHashedName,
  getNameAccountKey,
  NameRegistryState,
  React,
  AccountLayout,
  TOKEN_PROGRAM_ID,
  AsyncButton: createBrowserOnlyLibComponent("./AsyncButton", "AsyncButton"),
  usePrograms,
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
