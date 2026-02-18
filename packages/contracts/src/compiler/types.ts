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
 * Solidity Compiler Types
 *
 * Types for the Solidity compilation service.
 */

/**
 * Input for single-contract compilation
 */
export interface CompilationInput {
  /** Contract name (e.g., "SimpleStorage") */
  contractName: string;
  /** Solidity source code */
  source: string;
  /** Solidity version (default: 0.8.28) */
  version?: string;
  /** Optimizer settings */
  optimizer?: {
    enabled: boolean;
    runs: number;
  };
  /**
   * EVM version to target.
   * Default is 'paris' for Conflux compatibility (avoids PUSH0 opcode).
   * Use 'shanghai' or later only if the target chain supports PUSH0.
   */
  evmVersion?: string;
}

/**
 * Output from successful compilation
 */
export interface CompilationOutput {
  /** Contract name */
  contractName: string;
  /** Compiled bytecode (with 0x prefix) */
  bytecode: string;
  /** Deployed bytecode (runtime code) */
  deployedBytecode: string;
  /** Contract ABI */
  abi: unknown[];
  /** Compiler version used */
  compilerVersion: string;
  /** Gas estimates for deployment */
  gasEstimates?: {
    creation: {
      codeDepositCost: string;
      executionCost: string;
      totalCost: string;
    };
  };
}

/**
 * Compilation error or warning
 */
export interface CompilationError {
  /** Severity level */
  severity: 'error' | 'warning';
  /** Error message */
  message: string;
  /** Formatted error message with context */
  formattedMessage: string;
  /** Source location of the error */
  sourceLocation?: {
    file: string;
    start: number;
    end: number;
  };
}

/**
 * Result of compilation
 */
export interface CompilationResult {
  /** Whether compilation was successful */
  success: boolean;
  /** Compiled contracts */
  contracts: CompilationOutput[];
  /** Compilation errors */
  errors: CompilationError[];
  /** Compilation warnings */
  warnings: CompilationError[];
}
