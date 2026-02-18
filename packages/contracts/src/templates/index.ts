/*
 * Copyright 2025 Conflux DevKit Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Contract Templates Module
 *
 * Pre-defined Solidity contracts for testing deployment and interaction.
 *
 * @example
 * ```typescript
 * import {
 *   getSimpleStorageContract,
 *   getTestTokenContract,
 *   TEST_CONTRACTS,
 * } from '@conflux-devkit/contracts/templates';
 *
 * // Get compiled SimpleStorage
 * const simpleStorage = getSimpleStorageContract();
 * console.log(simpleStorage.abi);
 *
 * // List all available templates
 * console.log(Object.keys(TEST_CONTRACTS));
 * ```
 *
 * @packageDocumentation
 */

import {
  getSimpleStorageContract,
  SIMPLE_STORAGE_SOURCE,
} from './simple-storage.js';

import { getTestTokenContract, TEST_TOKEN_SOURCE } from './test-token.js';

// Re-export individual contracts
export {
  getSimpleStorageContract,
  SIMPLE_STORAGE_SOURCE,
} from './simple-storage.js';

export { getTestTokenContract, TEST_TOKEN_SOURCE } from './test-token.js';

/**
 * Available test contracts with metadata
 */
export const TEST_CONTRACTS = {
  SimpleStorage: {
    name: 'SimpleStorage',
    description: 'Simple contract for storing and retrieving a value',
    source: SIMPLE_STORAGE_SOURCE,
    getCompiled: getSimpleStorageContract,
  },
  TestToken: {
    name: 'TestToken',
    description: 'ERC20-like token for testing transfers and approvals',
    source: TEST_TOKEN_SOURCE,
    getCompiled: getTestTokenContract,
  },
} as const;

export type TestContractName = keyof typeof TEST_CONTRACTS;
