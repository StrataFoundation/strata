/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import AsyncButton from './AsyncButton';
import { usePrograms } from '../../hooks/programs';
import { BN } from "bn.js";
import { SplTokenBonding } from "@wum.bo/spl-token-bonding";
import { SplTokenCollective } from "@wum.bo/spl-token-collective";
import { getAssociatedAccountBalance } from "@wum.bo/spl-utils";
import { ExponentialCurveConfig, TimeCurveConfig } from "@wum.bo/spl-token-bonding";
import { PublicKey, Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, AccountLayout } from "@solana/spl-token";
import { sendMultipleInstructions } from "@wum.bo/spl-utils";
import { createNameRegistry, getHashedName, getNameAccountKey, NameRegistryState } from "@solana/spl-name-service";

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
  AsyncButton,
  usePrograms,
  BN,
  SplTokenBonding,
  PublicKey,
  SplTokenCollective,
  getAssociatedAccountBalance,
  ExponentialCurveConfig,
  TimeCurveConfig,
  Transaction,
  ...React,
};

export default ReactLiveScope;
