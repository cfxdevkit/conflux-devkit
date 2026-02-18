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
 * SimpleStorage Contract Template
 *
 * A simple contract for storing and retrieving a value.
 * Useful for testing deployment and basic contract interaction.
 */

import { compileSolidity, type CompilationOutput } from '../compiler/index.js';

/**
 * SimpleStorage contract source code
 */
export const SIMPLE_STORAGE_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleStorage {
    uint256 private storedValue;
    address public owner;

    event ValueChanged(uint256 indexed oldValue, uint256 indexed newValue, address indexed changedBy);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "SimpleStorage: caller is not the owner");
        _;
    }

    constructor(uint256 initialValue) {
        storedValue = initialValue;
        owner = msg.sender;
        emit ValueChanged(0, initialValue, msg.sender);
    }

    function set(uint256 newValue) public {
        uint256 oldValue = storedValue;
        storedValue = newValue;
        emit ValueChanged(oldValue, newValue, msg.sender);
    }

    function get() public view returns (uint256) {
        return storedValue;
    }

    function increment() public {
        uint256 oldValue = storedValue;
        storedValue += 1;
        emit ValueChanged(oldValue, storedValue, msg.sender);
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "SimpleStorage: new owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}`;

// Cache for compiled contract
let compiledSimpleStorage: CompilationOutput | null = null;

/**
 * Get compiled SimpleStorage contract
 *
 * The result is cached after first compilation for better performance.
 *
 * @returns Compiled contract with bytecode and ABI
 * @throws Error if compilation fails
 *
 * @example
 * ```typescript
 * const { bytecode, abi } = getSimpleStorageContract();
 * // Deploy with initialValue constructor argument
 * ```
 */
export function getSimpleStorageContract(): CompilationOutput {
  if (!compiledSimpleStorage) {
    const result = compileSolidity({
      contractName: 'SimpleStorage',
      source: SIMPLE_STORAGE_SOURCE,
    });

    if (!result.success || result.contracts.length === 0) {
      const errorMsg = result.errors.map((e) => e.message).join('\n');
      throw new Error(`Failed to compile SimpleStorage: ${errorMsg}`);
    }

    compiledSimpleStorage = result.contracts[0];
  }

  return compiledSimpleStorage;
}
