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
 * TestToken Contract Template
 *
 * An ERC20-like token for testing transfers and approvals.
 * Not a full ERC20 implementation but includes core functionality.
 */

import { compileSolidity, type CompilationOutput } from '../compiler/index.js';

/**
 * TestToken contract source code
 */
export const TEST_TOKEN_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TestToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _initialSupply * 10 ** decimals;
        balances[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }

    function allowance(address owner, address spender) public view returns (uint256) {
        return allowances[owner][spender];
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(to != address(0), "TestToken: transfer to zero address");
        require(balances[msg.sender] >= amount, "TestToken: insufficient balance");

        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        require(spender != address(0), "TestToken: approve to zero address");

        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(from != address(0), "TestToken: transfer from zero address");
        require(to != address(0), "TestToken: transfer to zero address");
        require(balances[from] >= amount, "TestToken: insufficient balance");
        require(allowances[from][msg.sender] >= amount, "TestToken: insufficient allowance");

        balances[from] -= amount;
        balances[to] += amount;
        allowances[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) public {
        require(to != address(0), "TestToken: mint to zero address");

        totalSupply += amount;
        balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(uint256 amount) public {
        require(balances[msg.sender] >= amount, "TestToken: burn amount exceeds balance");

        balances[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }
}`;

// Cache for compiled contract
let compiledTestToken: CompilationOutput | null = null;

/**
 * Get compiled TestToken contract
 *
 * The result is cached after first compilation for better performance.
 *
 * @returns Compiled contract with bytecode and ABI
 * @throws Error if compilation fails
 *
 * @example
 * ```typescript
 * const { bytecode, abi } = getTestTokenContract();
 * // Deploy with name, symbol, and initialSupply constructor arguments
 * ```
 */
export function getTestTokenContract(): CompilationOutput {
  if (!compiledTestToken) {
    const result = compileSolidity({
      contractName: 'TestToken',
      source: TEST_TOKEN_SOURCE,
    });

    if (!result.success || result.contracts.length === 0) {
      const errorMsg = result.errors.map((e) => e.message).join('\n');
      throw new Error(`Failed to compile TestToken: ${errorMsg}`);
    }

    compiledTestToken = result.contracts[0];
  }

  return compiledTestToken;
}
