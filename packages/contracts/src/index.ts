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
 * Conflux DevKit Contracts - Contract Deployment and Interaction
 *
 * This package provides utilities for deploying and interacting with
 * smart contracts on Conflux blockchain (Core Space + eSpace).
 *
 * Features:
 * - Contract Deployment: Deploy to single or multiple chains
 * - Contract Reader: Read contract state without gas costs
 * - Contract Writer: Execute state-changing transactions
 * - Standard ABIs: ERC20, ERC721, ERC1155
 *
 * @packageDocumentation
 */

// Deployer
export { ContractDeployer } from './deployer/deploy.js';

// Interaction
export { ContractReader } from './interaction/reader.js';
export { ContractWriter } from './interaction/writer.js';

// Standard ABIs
export { ERC20_ABI } from './abis/erc20.js';
export { ERC721_ABI } from './abis/erc721.js';
export { ERC1155_ABI } from './abis/erc1155.js';

// Types
export type {
  // Deployment
  DeploymentOptions,
  DeploymentResult,
  MultiChainDeploymentOptions,
  MultiChainDeploymentResult,

  // Interaction
  ReadOptions,
  WriteOptions,
  WriteResult,
  ContractInfo,

  // Events
  EventFilter,
  EventLog,

  // Token Info
  ERC20TokenInfo,
  ERC721TokenInfo,
  NFTMetadata,
} from './types/index.js';

// Errors
export { ContractError, DeploymentError, InteractionError } from './types/index.js';

// Version
export const VERSION = '0.1.0';
