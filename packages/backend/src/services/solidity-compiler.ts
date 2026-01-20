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
 */

import solc from 'solc';

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

export interface CompilationError {
  severity: 'error' | 'warning';
  message: string;
  formattedMessage: string;
  sourceLocation?: {
    file: string;
    start: number;
    end: number;
  };
}

export interface CompilationResult {
  success: boolean;
  contracts: CompilationOutput[];
  errors: CompilationError[];
  warnings: CompilationError[];
}

/**
 * Compile Solidity source code
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
          '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'evm.gasEstimates'],
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
          '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'evm.gasEstimates'],
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
    for (const [sourceName, sourceContracts] of Object.entries(output.contracts)) {
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
 * Get the solc version
 */
export function getSolcVersion(): string {
  return solc.version();
}
