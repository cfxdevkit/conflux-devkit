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
 * Solidity Compiler Service
 *
 * Provides Solidity compilation using solc-js.
 * Uses 'paris' EVM version by default for Conflux compatibility
 * (avoids PUSH0 opcode which is not supported by Conflux eSpace).
 */

import solc from 'solc';

import type {
  CompilationError,
  CompilationInput,
  CompilationOutput,
  CompilationResult,
} from './types.js';

/**
 * Compile Solidity source code
 *
 * @param input - Compilation input with source code and options
 * @returns Compilation result with contracts, errors, and warnings
 *
 * @example
 * ```typescript
 * const result = compileSolidity({
 *   contractName: 'MyContract',
 *   source: 'pragma solidity ^0.8.20; contract MyContract {}',
 * });
 *
 * if (result.success) {
 *   console.log(result.contracts[0].bytecode);
 * } else {
 *   console.error(result.errors);
 * }
 * ```
 */
export function compileSolidity(input: CompilationInput): CompilationResult {
  const { contractName, source, optimizer, evmVersion = 'paris' } = input;

  // Prepare solc input
  // Using 'paris' EVM version by default to avoid PUSH0 opcode (0x5f)
  // which is not supported by Conflux eSpace
  const solcInput = {
    language: 'Solidity',
    sources: {
      [`${contractName}.sol`]: {
        content: source,
      },
    },
    settings: {
      evmVersion,
      outputSelection: {
        '*': {
          '*': [
            'abi',
            'evm.bytecode',
            'evm.deployedBytecode',
            'evm.gasEstimates',
          ],
        },
      },
      optimizer: optimizer || {
        enabled: true,
        runs: 200,
      },
    },
  };

  // Compile
  const output = JSON.parse(solc.compile(JSON.stringify(solcInput)));

  // Process errors and warnings
  const errors: CompilationError[] = [];
  const warnings: CompilationError[] = [];

  if (output.errors) {
    for (const err of output.errors) {
      const compilationError: CompilationError = {
        severity: err.severity,
        message: err.message,
        formattedMessage: err.formattedMessage,
        sourceLocation: err.sourceLocation,
      };

      if (err.severity === 'error') {
        errors.push(compilationError);
      } else {
        warnings.push(compilationError);
      }
    }
  }

  // If there are errors, return failure
  if (errors.length > 0) {
    return {
      success: false,
      contracts: [],
      errors,
      warnings,
    };
  }

  // Extract compiled contracts
  const contracts: CompilationOutput[] = [];
  const sourceContracts = output.contracts?.[`${contractName}.sol`];

  if (sourceContracts) {
    for (const [name, contract] of Object.entries(sourceContracts)) {
      const c = contract as {
        abi: unknown[];
        evm: {
          bytecode: { object: string };
          deployedBytecode: { object: string };
          gasEstimates?: {
            creation: {
              codeDepositCost: string;
              executionCost: string;
              totalCost: string;
            };
          };
        };
      };

      contracts.push({
        contractName: name,
        bytecode: `0x${c.evm.bytecode.object}`,
        deployedBytecode: `0x${c.evm.deployedBytecode.object}`,
        abi: c.abi,
        compilerVersion: solc.version(),
        gasEstimates: c.evm.gasEstimates,
      });
    }
  }

  return {
    success: contracts.length > 0,
    contracts,
    errors,
    warnings,
  };
}

/**
 * Compile multiple Solidity sources
 *
 * Useful for compiling contracts with imports or multiple files.
 *
 * @param sources - Map of file names to source content
 * @param optimizer - Optimizer settings (optional)
 * @param evmVersion - EVM version to target (default: 'paris')
 * @returns Compilation result with all contracts
 *
 * @example
 * ```typescript
 * const result = compileMultipleSources({
 *   'IERC20.sol': 'interface IERC20 { ... }',
 *   'MyToken.sol': 'import "./IERC20.sol"; contract MyToken is IERC20 { ... }',
 * });
 * ```
 */
export function compileMultipleSources(
  sources: Record<string, string>,
  optimizer?: { enabled: boolean; runs: number },
  evmVersion = 'paris'
): CompilationResult {
  // Prepare solc input with multiple sources
  const solcSources: Record<string, { content: string }> = {};
  for (const [name, content] of Object.entries(sources)) {
    solcSources[name.endsWith('.sol') ? name : `${name}.sol`] = { content };
  }

  // Using 'paris' EVM version by default to avoid PUSH0 opcode
  const solcInput = {
    language: 'Solidity',
    sources: solcSources,
    settings: {
      evmVersion,
      outputSelection: {
        '*': {
          '*': [
            'abi',
            'evm.bytecode',
            'evm.deployedBytecode',
            'evm.gasEstimates',
          ],
        },
      },
      optimizer: optimizer || {
        enabled: true,
        runs: 200,
      },
    },
  };

  // Compile
  const output = JSON.parse(solc.compile(JSON.stringify(solcInput)));

  // Process errors and warnings
  const errors: CompilationError[] = [];
  const warnings: CompilationError[] = [];

  if (output.errors) {
    for (const err of output.errors) {
      const compilationError: CompilationError = {
        severity: err.severity,
        message: err.message,
        formattedMessage: err.formattedMessage,
        sourceLocation: err.sourceLocation,
      };

      if (err.severity === 'error') {
        errors.push(compilationError);
      } else {
        warnings.push(compilationError);
      }
    }
  }

  // If there are errors, return failure
  if (errors.length > 0) {
    return {
      success: false,
      contracts: [],
      errors,
      warnings,
    };
  }

  // Extract all compiled contracts
  const contracts: CompilationOutput[] = [];

  if (output.contracts) {
    for (const [sourceName, sourceContracts] of Object.entries(
      output.contracts
    )) {
      for (const [contractName, contract] of Object.entries(
        sourceContracts as Record<string, unknown>
      )) {
        const c = contract as {
          abi: unknown[];
          evm: {
            bytecode: { object: string };
            deployedBytecode: { object: string };
            gasEstimates?: {
              creation: {
                codeDepositCost: string;
                executionCost: string;
                totalCost: string;
              };
            };
          };
        };

        // Skip empty bytecode (interfaces, abstract contracts)
        if (!c.evm.bytecode.object) continue;

        contracts.push({
          contractName: `${sourceName}:${contractName}`,
          bytecode: `0x${c.evm.bytecode.object}`,
          deployedBytecode: `0x${c.evm.deployedBytecode.object}`,
          abi: c.abi,
          compilerVersion: solc.version(),
          gasEstimates: c.evm.gasEstimates,
        });
      }
    }
  }

  return {
    success: contracts.length > 0,
    contracts,
    errors,
    warnings,
  };
}

/**
 * Get the solc compiler version
 *
 * @returns The version string of the solc compiler
 */
export function getSolcVersion(): string {
  return solc.version();
}
