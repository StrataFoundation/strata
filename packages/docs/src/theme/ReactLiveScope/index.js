/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import AsyncButton from './AsyncButton';
import { usePrograms } from '../../hooks/programs';

// Add react-live imports you need here
const ReactLiveScope = {
  React,
  AsyncButton,
  usePrograms,
  ...React,
};

export default ReactLiveScope;
