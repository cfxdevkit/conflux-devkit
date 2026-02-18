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
 * Solidity Compiler Module
 *
 * Provides Solidity compilation using solc-js.
 *
 * @example
 * ```typescript
 * import { compileSolidity, getSolcVersion } from '@conflux-devkit/contracts/compiler';
 *
 * console.log('Solc version:', getSolcVersion());
 *
 * const result = compileSolidity({
 *   contractName: 'MyContract',
 *   source: `
 *     pragma solidity ^0.8.20;
 *     contract MyContract {
 *       uint256 public value;
 *       function setValue(uint256 _value) public {
 *         value = _value;
 *       }
 *     }
 *   `,
 * });
 *
 * if (result.success) {
 *   const { bytecode, abi } = result.contracts[0];
 *   // Deploy using bytecode and abi
 * }
 * ```
 *
 * @packageDocumentation
 */

// Compiler functions
export {
  compileMultipleSources,
  compileSolidity,
  getSolcVersion,
} from './solidity-compiler.js';

// Types
export type {
  CompilationError,
  CompilationInput,
  CompilationOutput,
  CompilationResult,
} from './types.js';
